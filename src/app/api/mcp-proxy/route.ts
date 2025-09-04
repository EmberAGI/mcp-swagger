import { NextRequest, NextResponse } from "next/server";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface ProxyConfig {
  transport: "streamable-http" | "stdio";
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

let activeTransport:
  | StreamableHTTPClientTransport
  | StdioClientTransport
  | null = null;
let sessionId: string | null = null;

export async function POST(request: NextRequest) {
  try {
    const config: ProxyConfig = await request.json();
    console.log("[MCP Proxy] Starting transport:", config.transport);

    // Clean up existing transport
    if (activeTransport) {
      try {
        if (typeof activeTransport.close === "function") {
          await activeTransport.close();
        }
        if (
          "terminateSession" in activeTransport &&
          typeof (activeTransport as any).terminateSession === "function"
        ) {
          await (activeTransport as any).terminateSession();
        }
      } catch (e) {
        console.log("[MCP Proxy] Error cleaning up previous transport:", e);
      }
      activeTransport = null;
    }

    let transport;

    switch (config.transport) {
      case "streamable-http":
        if (!config.url) {
          return NextResponse.json(
            { error: "URL required for streamable-http" },
            { status: 400 }
          );
        }
        console.log(
          "[MCP Proxy] Creating StreamableHTTP transport for:",
          config.url
        );
        transport = new StreamableHTTPClientTransport(new URL(config.url), {
          requestInit: {
            headers: {
              "User-Agent": "MCP-Swagger-Proxy/1.0",
              ...config.headers,
            },
          },
        });
        break;

      case "stdio":
        if (!config.command) {
          return NextResponse.json(
            { error: "Command required for stdio" },
            { status: 400 }
          );
        }
        console.log(
          "[MCP Proxy] Creating STDIO transport for command:",
          config.command
        );

        // For STDIO, we need to parse the command properly
        const { findActualExecutable } = await import("spawn-rx");
        const { parse: shellParseArgs } = await import("shell-quote");

        const origArgs = shellParseArgs(
          config.args?.join(" ") || ""
        ) as string[];
        const { cmd, args } = findActualExecutable(config.command, origArgs);

        console.log(
          `[MCP Proxy] STDIO transport: command=${cmd}, args=${args}`
        );

        transport = new StdioClientTransport({
          command: cmd,
          args,
          env: { ...process.env, ...(config.env || {}) } as Record<
            string,
            string
          >,
          stderr: "pipe",
        });

        break;

      default:
        return NextResponse.json(
          { error: "Unsupported transport type" },
          { status: 400 }
        );
    }

    console.log("[MCP Proxy] Starting transport...");
    await transport.start();

    activeTransport = transport;

    // Generate session ID for tracking
    sessionId = Math.random().toString(36).substr(2, 9);

    console.log(
      "[MCP Proxy] Transport started successfully, session:",
      sessionId
    );

    return NextResponse.json({
      success: true,
      sessionId,
      transport: config.transport,
      message: "MCP proxy transport started",
    });
  } catch (error) {
    console.error("[MCP Proxy] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        details: "Failed to start MCP proxy transport",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  console.log("[MCP Proxy] Terminating active transport...");

  if (activeTransport) {
    try {
      if (typeof activeTransport.close === "function") {
        await activeTransport.close();
      }
      if (
        "terminateSession" in activeTransport &&
        typeof (activeTransport as any).terminateSession === "function"
      ) {
        await (activeTransport as any).terminateSession();
      }
      activeTransport = null;
      sessionId = null;
      console.log("[MCP Proxy] Transport terminated");
    } catch (error) {
      console.error("[MCP Proxy] Error terminating transport:", error);
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: "MCP proxy transport terminated",
  });
}

// Get current session status
export async function GET() {
  return NextResponse.json({
    active: activeTransport !== null,
    sessionId,
    transport: activeTransport?.constructor?.name || null,
  });
}
