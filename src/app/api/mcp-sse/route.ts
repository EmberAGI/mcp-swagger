import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get("url");

  console.log("[SSE Proxy] Request for URL:", targetUrl);

  if (!targetUrl) {
    console.log("[SSE Proxy] Error: No URL provided");
    return new Response("URL parameter is required", { status: 400 });
  }

  // Validate URL
  try {
    new URL(targetUrl);
  } catch {
    console.log("[SSE Proxy] Error: Invalid URL format");
    return new Response("Invalid URL format", { status: 400 });
  }

  const encoder = new TextEncoder();

  try {
    console.log("[SSE Proxy] Attempting to connect to:", targetUrl);

    // Create a readable stream that forwards SSE events
    const stream = new ReadableStream({
      async start(controller) {
        let response: Response;
        let reader: ReadableStreamDefaultReader<Uint8Array>;

        try {
          // Add timeout to prevent hanging
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout

          response = await fetch(targetUrl, {
            headers: {
              Accept: "text/event-stream",
              "Cache-Control": "no-cache",
              "User-Agent": "MCP-Swagger-Proxy/1.0",
            },
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          console.log(
            `[SSE Proxy] Response status: ${response.status} ${response.statusText}`
          );
          console.log(
            `[SSE Proxy] Response headers:`,
            Object.fromEntries(response.headers.entries())
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `HTTP ${response.status}: ${response.statusText}. Body: ${errorText}`
            );
          }

          if (!response.body) {
            throw new Error("No response body received");
          }

          reader = response.body.getReader();

          // Send initial connection success message
          const connectMessage = `event: connect\ndata: {"status":"connected","url":"${targetUrl}"}\n\n`;
          controller.enqueue(encoder.encode(connectMessage));

          console.log("[SSE Proxy] Starting to read stream...");

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log("[SSE Proxy] Stream ended normally");
              break;
            }

            // Forward the chunk directly to maintain SSE format
            controller.enqueue(value);
          }
        } catch (error) {
          console.error("[SSE Proxy] Stream error:", error);
          console.error("[SSE Proxy] Error type:", typeof error);
          console.error(
            "[SSE Proxy] Error stringified:",
            JSON.stringify(error)
          );

          // Determine error message
          let errorMessage = "Unknown proxy error";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          } else if (error && typeof error === "object") {
            errorMessage = error.toString();
          }

          // Send error as SSE event
          const sseErrorMessage = `event: error\ndata: ${JSON.stringify({
            error: errorMessage,
            errorType: typeof error,
            timestamp: new Date().toISOString(),
            proxyStep: "stream_reading",
          })}\n\n`;

          controller.enqueue(encoder.encode(sseErrorMessage));
        } finally {
          try {
            reader?.releaseLock();
          } catch (e) {
            console.log("[SSE Proxy] Error releasing reader:", e);
          }
          controller.close();
        }
      },

      cancel() {
        console.log("[SSE Proxy] Stream cancelled by client");
      },
    });

    console.log("[SSE Proxy] Returning SSE stream");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("[SSE Proxy] Setup error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to setup SSE proxy",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
