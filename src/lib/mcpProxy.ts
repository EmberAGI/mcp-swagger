import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

interface ProxyOptions {
  transportToClient: Transport;
  transportToServer: Transport;
}

export function mcpProxy({
  transportToClient,
  transportToServer,
}: ProxyOptions) {
  console.log(
    "[MCP Proxy] Starting proxy between client and server transports"
  );

  // Forward messages from client to server
  transportToClient.onmessage = async (message: JSONRPCMessage) => {
    try {
      // Enhanced logging for createSwap requests
      if (
        "method" in message &&
        message.method === "tools/call" &&
        (message as any).params?.name === "createSwap"
      ) {
        console.log(
          "[MCP Proxy] *** CREATE SWAP REQUEST (Client -> Server) ***"
        );
        console.log(
          "[MCP Proxy] Full createSwap request:",
          JSON.stringify(message, null, 2)
        );
        console.log(
          "[MCP Proxy] createSwap arguments:",
          (message as any).params?.arguments
        );
      }

      console.log(
        "[MCP Proxy] Client -> Server:",
        JSON.stringify(message, null, 2)
      );
      await transportToServer.send(message);
    } catch (error) {
      console.error("[MCP Proxy] Error forwarding client -> server:", error);
    }
  };

  // Forward messages from server to client
  transportToServer.onmessage = async (message: JSONRPCMessage) => {
    try {
      // Enhanced logging for createSwap responses
      if (
        "method" in message &&
        message.method === "tools/call" &&
        (message as any).params?.name === "createSwap"
      ) {
        console.log(
          "[MCP Proxy] *** CREATE SWAP RESPONSE (Server -> Client) ***"
        );
        console.log(
          "[MCP Proxy] Full createSwap response:",
          JSON.stringify(message, null, 2)
        );
        console.log("[MCP Proxy] createSwap result:", (message as any).result);
        console.log("[MCP Proxy] createSwap error:", (message as any).error);

        // Check for elicitation patterns in the response
        const hasElicitationPatterns =
          ((message as any).params &&
            (message as any).params.message &&
            (message as any).params.requestedSchema) ||
          ((message as any).result &&
            (message as any).result.message &&
            (message as any).result.requestedSchema) ||
          ((message as any).params &&
            (message as any).params._meta &&
            (message as any).params._meta.progressToken) ||
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

      console.log(
        "[MCP Proxy] Server -> Client:",
        JSON.stringify(message, null, 2)
      );
      await transportToClient.send(message);
    } catch (error) {
      console.error("[MCP Proxy] Error forwarding server -> client:", error);
    }
  };

  // Handle client transport errors
  transportToClient.onerror = (error: any) => {
    console.error("[MCP Proxy] Client transport error:", error);
  };

  // Handle server transport errors
  transportToServer.onerror = (error: any) => {
    console.error("[MCP Proxy] Server transport error:", error);
  };

  // Handle transport closures
  const cleanup = () => {
    console.log("[MCP Proxy] Cleaning up proxy connections");
    try {
      if (transportToClient.close) {
        transportToClient.close();
      }
      if (transportToServer.close) {
        transportToServer.close();
      }
    } catch (error) {
      console.error("[MCP Proxy] Error during cleanup:", error);
    }
  };

  transportToClient.onclose = cleanup;
  transportToServer.onclose = cleanup;

  console.log("[MCP Proxy] Proxy setup complete");
}
