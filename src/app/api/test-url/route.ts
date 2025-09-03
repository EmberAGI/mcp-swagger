import { NextRequest, NextResponse } from "next/server";

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

    const result = {
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      accessible: response.ok,
      supportsSSE:
        response.headers.get("content-type")?.includes("text/event-stream") ||
        false,
      timestamp: new Date().toISOString(),
    };

    // Also test with SSE headers
    try {
      const sseResponse = await fetch(testUrl, {
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
          "User-Agent": "MCP-Swagger-Test/1.0",
        },
      });

      result.sseTest = {
        status: sseResponse.status,
        statusText: sseResponse.statusText,
        contentType: sseResponse.headers.get("content-type"),
        accessible: sseResponse.ok,
      };
    } catch (sseError) {
      result.sseTest = {
        error: sseError instanceof Error ? sseError.message : String(sseError),
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

