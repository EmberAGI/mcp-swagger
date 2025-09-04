import { NextRequest, NextResponse } from "next/server";

interface TestResult {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  accessible: boolean;
  supportsStreamableHTTP: boolean;
  timestamp: string;
  streamableHTTPTest?: {
    status: number;
    statusText: string;
    contentType: string | null;
    accessible: boolean;
    error?: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testUrl = searchParams.get("url");

  if (!testUrl) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`[URL Test] Testing URL: ${testUrl}`);

    // Test basic HTTP connectivity
    const response = await fetch(testUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "MCP-Swagger-Test/1.0",
      },
    });

    console.log(`[URL Test] Response status: ${response.status}`);
    console.log(
      `[URL Test] Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    const result: TestResult = {
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      accessible: response.ok,
      supportsStreamableHTTP: false,
      timestamp: new Date().toISOString(),
    };

    // Test Streamable HTTP support
    try {
      const streamableResponse = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
          "User-Agent": "MCP-Swagger-Test/1.0",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2025-06-18",
            capabilities: {},
            clientInfo: {
              name: "mcp-swagger-test",
              version: "1.0.0",
            },
          },
        }),
      });

      result.streamableHTTPTest = {
        status: streamableResponse.status,
        statusText: streamableResponse.statusText,
        contentType: streamableResponse.headers.get("content-type"),
        accessible: streamableResponse.ok,
      };

      result.supportsStreamableHTTP =
        streamableResponse.ok &&
        ((streamableResponse.headers
          .get("content-type")
          ?.includes("text/event-stream") ??
          false) ||
          (streamableResponse.headers
            .get("content-type")
            ?.includes("application/json") ??
            false));
    } catch (streamableError) {
      result.streamableHTTPTest = {
        status: 0,
        statusText: "Error",
        contentType: null,
        accessible: false,
        error:
          streamableError instanceof Error
            ? streamableError.message
            : String(streamableError),
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[URL Test] Error testing ${testUrl}:`, error);

    return NextResponse.json({
      url: testUrl,
      error: error instanceof Error ? error.message : String(error),
      accessible: false,
      timestamp: new Date().toISOString(),
    });
  }
}
