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
