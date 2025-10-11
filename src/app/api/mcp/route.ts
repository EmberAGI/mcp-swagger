import { NextRequest, NextResponse } from "next/server";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { randomUUID } from "crypto";
import { createExpressMocks, createExpressResponse } from "@/lib/express-mock";

// Store transports by session ID
const webAppTransports = new Map<string, StreamableHTTPServerTransport>();
const serverTransports = new Map<string, Transport>();

// MCP Proxy function to forward messages between transports
function mcpProxy({
  transportToClient,
  transportToServer,
}: {
  transportToClient: Transport;
  transportToServer: Transport;
}) {
  let transportToClientClosed = false;
  let transportToServerClosed = false;
  let reportedServerSession = false;

  transportToClient.onmessage = (message) => {
    // Enhanced logging for createSwap requests
    if (
      "method" in message &&
      message.method === "tools/call" &&
      "params" in message &&
      (message.params as any)?.name === "createSwap"
    ) {
      console.log("[MCP Proxy] *** CREATE SWAP REQUEST FROM CLIENT ***");
      console.log(
        "[MCP Proxy] Full createSwap client request:",
        JSON.stringify(message, null, 2)
      );
      console.log(
        "[MCP Proxy] createSwap arguments:",
        (message.params as any)?.arguments
      );
    }

    // Log all client requests for debugging
    console.log("[MCP Proxy] Message from client to server:", {
      method: "method" in message ? message.method : "unknown",
      hasParams: "params" in message,
      hasId: "id" in message,
      messageSize: JSON.stringify(message).length,
      timestamp: new Date().toISOString(),
    });

    transportToServer.send(message).catch((error) => {
      console.error("[MCP Proxy] Error sending to server:", error);
      // Send error response back to client if it was a request
      if (
        "id" in message &&
        message.id !== undefined &&
        !transportToClientClosed
      ) {
        const errorResponse = {
          jsonrpc: "2.0" as const,
          id: message.id,
          error: {
            code: -32001,
            message: error.message,
            data: error,
          },
        };
        transportToClient.send(errorResponse).catch(console.error);
      }
    });
  };

  transportToServer.onmessage = (message) => {
    if (!reportedServerSession && "sessionId" in transportToServer) {
      console.log(
        "[MCP Proxy] Server sessionId:",
        (
          transportToServer as StreamableHTTPClientTransport & {
            sessionId?: string;
          }
        ).sessionId
      );
      reportedServerSession = true;
    }

    // Enhanced logging for createSwap responses
    if (
      "method" in message &&
      message.method === "tools/call" &&
      "params" in message &&
      (message.params as any)?.name === "createSwap"
    ) {
      console.log("[MCP Proxy] *** CREATE SWAP RESPONSE FROM SERVER ***");
      console.log(
        "[MCP Proxy] Full createSwap server response:",
        JSON.stringify(message, null, 2)
      );
      console.log(
        "[MCP Proxy] createSwap result:",
        "result" in message ? message.result : "none"
      );
      console.log("[MCP Proxy] createSwap params:", message.params);
      console.log(
        "[MCP Proxy] createSwap error:",
        "error" in message ? message.error : "none"
      );

      // Check for elicitation patterns in the response
      const hasElicitationPatterns =
        (message.params &&
          (message.params as any).message &&
          (message.params as any).requestedSchema) ||
        ("result" in message &&
          message.result &&
          (message.result as any).message &&
          (message.result as any).requestedSchema) ||
        (message.params &&
          (message.params as any)._meta &&
          (message.params as any)._meta.progressToken) ||
        JSON.stringify(message).toLowerCase().includes("elicit");

      console.log(
        "[MCP Proxy] createSwap elicitation patterns detected:",
        hasElicitationPatterns
      );
      if (hasElicitationPatterns) {
        console.log(
          "[MCP Proxy] *** ELICITATION DETECTED IN CREATE SWAP RESPONSE ***"
        );
      }
    }

    // Special handling for elicitation/create notifications
    if ("method" in message && message.method === "elicitation/create") {
      console.log(
        "[MCP Proxy] *** ELICITATION/CREATE NOTIFICATION FROM SERVER ***"
      );
      console.log(
        "[MCP Proxy] Full elicitation notification:",
        JSON.stringify(message, null, 2)
      );
      console.log(
        "[MCP Proxy] Elicitation message:",
        (message.params as any)?.message
      );
      console.log(
        "[MCP Proxy] Elicitation schema:",
        (message.params as any)?.requestedSchema
      );
      console.log("[MCP Proxy] *** FORWARDING ELICITATION TO CLIENT ***");
    }

    // Log all messages for debugging
    console.log("[MCP Proxy] Message from server to client:", {
      method: "method" in message ? message.method : "unknown",
      hasResult: "result" in message,
      hasError: "error" in message,
      hasParams: "params" in message,
      messageSize: JSON.stringify(message).length,
      timestamp: new Date().toISOString(),
    });

    transportToClient.send(message).catch((error) => {
      console.error("[MCP Proxy] Error sending message to client:", error);
    });
  };

  transportToClient.onclose = () => {
    if (transportToServerClosed) return;
    transportToClientClosed = true;
    transportToServer.close().catch(console.error);
  };

  transportToServer.onclose = () => {
    if (transportToClientClosed) return;
    console.log(
      "[MCP Proxy] Server transport closed, but keeping client connection alive for elicitation"
    );
    // Don't immediately close the client connection
    // Give time for any pending elicitation messages to be processed
    setTimeout(() => {
      if (!transportToClientClosed) {
        transportToClientClosed = true;
        transportToClient.close().catch(console.error);
      }
    }, 2000); // Wait 2 seconds before closing
  };

  transportToClient.onerror = (error) => {
    console.error("[MCP Proxy] Client transport error:", error);
  };

  transportToServer.onerror = (error) => {
    console.error("[MCP Proxy] Server transport error:", error);
    // Don't close the connection immediately on server errors
    // The elicitation message might still be in transit
    console.log(
      "[MCP Proxy] Server transport error occurred, but keeping connection alive for elicitation"
    );
  };
}

// Create transport based on type
async function createTransport(
  url: string,
  transportType: string,
  headers: Record<string, string>
): Promise<Transport> {
  if (transportType === "streamable-http") {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers },
    });
    await transport.start();
    return transport;
  } else if (transportType === "stdio") {
    // Parse command and args from URL
    const urlObj = new URL(url);
    const command = urlObj.searchParams.get("command") || "";
    const args = JSON.parse(urlObj.searchParams.get("args") || "[]");

    const transport = new StdioClientTransport({
      command,
      args,
      env: process.env as Record<string, string>,
    });
    await transport.start();
    return transport;
  } else {
    throw new Error(`Unsupported transport type: ${transportType}`);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.headers.get("mcp-session-id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    console.log(`[MCP API] GET request for session ${sessionId}`);

    const transport = webAppTransports.get(sessionId);
    if (!transport) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Create proper Express mocks
    const mockReq = createExpressMocks(request);

    // Create a proper response handler
    return new Promise<NextResponse>((resolve) => {
      const mockRes = createExpressResponse((result) => {
        // Add CORS headers
        result.headers.set("Access-Control-Allow-Origin", "*");
        result.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, DELETE, OPTIONS"
        );
        result.headers.set("Access-Control-Allow-Headers", "*");
        result.headers.set("Access-Control-Expose-Headers", "mcp-session-id");

        resolve(
          new NextResponse(result.body, {
            status: result.status,
            headers: result.headers,
          })
        );
      });

      transport.handleRequest(mockReq, mockRes).catch((error: any) => {
        console.error("[MCP API] GET transport error:", error);
        resolve(
          NextResponse.json(
            { error: "Failed to handle request", details: error.message },
            { status: 500 }
          )
        );
      });
    });
  } catch (error: any) {
    console.error("[MCP API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to handle request", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const transportType =
      searchParams.get("transportType") || "streamable-http";
    const sessionId = request.headers.get("mcp-session-id");

    console.log(
      `[MCP API] POST request - session: ${sessionId}, url: ${url}, transport: ${transportType}`
    );

    // Handle existing session
    if (sessionId) {
      const transport = webAppTransports.get(sessionId);
      if (!transport) {
        // Session not found - create new session with provided session ID
        console.log(
          `[MCP API] Session ${sessionId} not found, creating new session...`
        );

        if (!url) {
          return NextResponse.json(
            { error: "Missing URL for new session" },
            { status: 400 }
          );
        }

        // Extract headers to pass through
        const headers: Record<string, string> = {
          Accept: "text/event-stream, application/json",
          "Content-Type": "application/json",
        };

        // Pass through authorization header if present
        const authHeader = request.headers.get("authorization");
        if (authHeader) {
          headers["Authorization"] = authHeader;
        }

        // Create server transport
        let serverTransport: Transport;
        try {
          serverTransport = await createTransport(url, transportType, headers);
          console.log(
            "[MCP API] Created server transport for session recreation"
          );
        } catch (error: any) {
          console.error("[MCP API] Failed to create server transport:", error);
          return NextResponse.json(
            {
              error: "Failed to connect to MCP server",
              details: error.message,
            },
            { status: 502 }
          );
        }

        // Create web app transport with the provided session ID
        const webAppTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
          onsessioninitialized: (newSessionId) => {
            webAppTransports.set(newSessionId, webAppTransport);
            serverTransports.set(newSessionId, serverTransport);
            console.log(`[MCP API] Session recreated: ${newSessionId}`);
          },
        });

        await webAppTransport.start();
        console.log(
          "[MCP API] Started web app transport for session recreation"
        );

        // Setup proxy between transports
        mcpProxy({
          transportToClient: webAppTransport,
          transportToServer: serverTransport,
        });

        // Handle the request
        const body = await request.text();
        const parsedBody = body ? JSON.parse(body) : undefined;

        // Enhanced logging for createSwap requests
        if (
          parsedBody &&
          parsedBody.method === "tools/call" &&
          parsedBody.params?.name === "createSwap"
        ) {
          console.log("[MCP API] *** CREATE SWAP REQUEST HANDLED ***");
          console.log(
            "[MCP API] Full createSwap request body:",
            JSON.stringify(parsedBody, null, 2)
          );
          console.log(
            "[MCP API] createSwap arguments:",
            parsedBody.params?.arguments
          );
        }

        // Log all requests for debugging
        console.log("[MCP API] Handling request:", {
          method: parsedBody?.method,
          hasParams: !!parsedBody?.params,
          hasId: !!parsedBody?.id,
          bodySize: body.length,
          timestamp: new Date().toISOString(),
        });

        const mockReq = createExpressMocks(request, body, parsedBody);

        return new Promise((resolve) => {
          const mockRes = createExpressResponse((result) => {
            result.headers.set("Access-Control-Allow-Origin", "*");
            result.headers.set(
              "Access-Control-Allow-Methods",
              "GET, POST, DELETE, OPTIONS"
            );
            result.headers.set("Access-Control-Allow-Headers", "*");
            result.headers.set(
              "Access-Control-Expose-Headers",
              "mcp-session-id"
            );

            resolve(
              new NextResponse(result.body, {
                status: result.status,
                headers: result.headers,
              })
            );
          });

          webAppTransport
            .handleRequest(mockReq, mockRes, parsedBody)
            .catch((error: any) => {
              console.error("[MCP API] Request handling error:", error);
              resolve(
                NextResponse.json(
                  { error: "Failed to handle request", details: error.message },
                  { status: 500 }
                )
              );
            });
        });
      }

      const body = await request.text();
      const parsedBody = body ? JSON.parse(body) : undefined;

      // If this is an initialize call on an already initialized/upstream session,
      // recreate the upstream server transport to ensure a clean handshake.
      if (parsedBody && parsedBody.method === "initialize") {
        try {
          const existingServerTransport = serverTransports.get(sessionId);
          if (existingServerTransport) {
            try {
              await existingServerTransport.close();
            } catch (e) {
              console.warn(
                "[MCP API] Error closing existing server transport:",
                e
              );
            }
            serverTransports.delete(sessionId);
          }

          if (!url) {
            console.warn(
              "[MCP API] Missing URL on initialize; proceeding without upstream reset"
            );
          } else {
            // Extract headers to pass through
            const headers: Record<string, string> = {
              Accept: "text/event-stream, application/json",
              "Content-Type": "application/json",
            };
            const authHeader = request.headers.get("authorization");
            if (authHeader) {
              headers["Authorization"] = authHeader;
            }

            const newServerTransport = await createTransport(
              url,
              transportType,
              headers
            );
            serverTransports.set(sessionId, newServerTransport);

            // Rewire proxy between existing webApp transport and new server transport
            mcpProxy({
              transportToClient: transport,
              transportToServer: newServerTransport,
            });
            console.log(
              "[MCP API] Upstream transport recreated for initialize"
            );
          }
        } catch (recreateError: any) {
          console.error(
            "[MCP API] Failed to recreate upstream transport:",
            recreateError
          );
          return NextResponse.json(
            {
              error: "Failed to reset upstream transport",
              details: recreateError.message,
            },
            { status: 502 }
          );
        }
      }

      // Create proper Express mocks
      const mockReq = createExpressMocks(request, body, parsedBody);

      return new Promise((resolve) => {
        const mockRes = createExpressResponse((result) => {
          // Add CORS headers
          result.headers.set("Access-Control-Allow-Origin", "*");
          result.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, DELETE, OPTIONS"
          );
          result.headers.set("Access-Control-Allow-Headers", "*");
          result.headers.set("Access-Control-Expose-Headers", "mcp-session-id");

          resolve(
            new NextResponse(result.body, {
              status: result.status,
              headers: result.headers,
            })
          );
        });

        transport
          .handleRequest(mockReq, mockRes, parsedBody)
          .catch((error: any) => {
            console.error("[MCP API] Request handling error:", error);
            resolve(
              NextResponse.json(
                { error: "Failed to handle request", details: error.message },
                { status: 500 }
              )
            );
          });
      });
    }

    // New session - create transports
    if (!url) {
      return NextResponse.json(
        { error: "Missing URL for new session" },
        { status: 400 }
      );
    }

    console.log("[MCP API] Creating new session...");

    // Extract headers to pass through
    const headers: Record<string, string> = {
      Accept: "text/event-stream, application/json",
      "Content-Type": "application/json",
    };

    // Pass through authorization header if present
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Create server transport
    let serverTransport: Transport;
    try {
      serverTransport = await createTransport(url, transportType, headers);
      console.log("[MCP API] Created server transport");
    } catch (error: any) {
      console.error("[MCP API] Failed to create server transport:", error);
      return NextResponse.json(
        { error: "Failed to connect to MCP server", details: error.message },
        { status: 502 }
      );
    }

    // Create web app transport with session management
    const webAppTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: randomUUID,
      onsessioninitialized: (newSessionId) => {
        webAppTransports.set(newSessionId, webAppTransport);
        serverTransports.set(newSessionId, serverTransport);
        console.log(
          `[MCP API] Session initialized: Client <-> Proxy sessionId: ${newSessionId}`
        );
      },
    });

    await webAppTransport.start();
    console.log("[MCP API] Started web app transport");

    // Setup proxy between transports
    mcpProxy({
      transportToClient: webAppTransport,
      transportToServer: serverTransport,
    });

    // Handle the initial request
    const body = await request.text();
    const parsedBody = body ? JSON.parse(body) : undefined;

    // Create proper Express mocks
    const mockReq = createExpressMocks(request, body, parsedBody);

    return new Promise((resolve) => {
      const mockRes = createExpressResponse((result) => {
        // Add CORS headers
        result.headers.set("Access-Control-Allow-Origin", "*");
        result.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, DELETE, OPTIONS"
        );
        result.headers.set("Access-Control-Allow-Headers", "*");
        result.headers.set("Access-Control-Expose-Headers", "mcp-session-id");

        resolve(
          new NextResponse(result.body, {
            status: result.status,
            headers: result.headers,
          })
        );
      });

      webAppTransport
        .handleRequest(mockReq, mockRes, parsedBody)
        .catch((error: any) => {
          console.error("[MCP API] Initial request handling error:", error);
          resolve(
            NextResponse.json(
              { error: "Failed to handle request", details: error.message },
              { status: 500 }
            )
          );
        });
    });
  } catch (error: any) {
    console.error("[MCP API] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.headers.get("mcp-session-id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    console.log(`[MCP API] DELETE request for session ${sessionId}`);

    const serverTransport = serverTransports.get(sessionId);
    const webAppTransport = webAppTransports.get(sessionId);

    if (!serverTransport || !webAppTransport) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Close transports
    await serverTransport.close();
    await webAppTransport.close();

    // Remove from maps
    serverTransports.delete(sessionId);
    webAppTransports.delete(sessionId);

    console.log(`[MCP API] Session ${sessionId} deleted`);

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error("[MCP API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete session", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}
