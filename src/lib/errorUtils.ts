/**
 * Utility functions for better error handling and messaging
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    // Try to extract meaningful info from object errors
    const errorObj = error as any;

    if (errorObj.message) {
      return String(errorObj.message);
    }

    if (errorObj.error) {
      return String(errorObj.error);
    }

    if (errorObj.name) {
      return `${errorObj.name}: ${errorObj.toString()}`;
    }

    return errorObj.toString();
  }

  return "Unknown error occurred";
}

export function getDetailedErrorInfo(error: unknown) {
  return {
    message: getErrorMessage(error),
    type: typeof error,
    isError: error instanceof Error,
    name: error instanceof Error ? error.name : undefined,
    stack: error instanceof Error ? error.stack : undefined,
    stringified: JSON.stringify(error),
    timestamp: new Date().toISOString(),
  };
}

export function categorizeConnectionError(errorMessage: string): {
  category: string;
  userFriendlyMessage: string;
  suggestions: string[];
} {
  const msg = errorMessage.toLowerCase();

  // Check HTTP status codes first (they're more definitive than keywords)
  if (
    msg.includes("http 404") ||
    msg.includes("404:") ||
    (msg.includes("404") && msg.includes("not found"))
  ) {
    return {
      category: "not_found",
      userFriendlyMessage:
        "Server not found: The MCP endpoint doesn't exist at this URL (HTTP 404).",
      suggestions: [
        "Double-check the server URL - this endpoint doesn't exist",
        "Try a different MCP server URL",
        "Verify this is actually an MCP server endpoint",
        "Check the server documentation for the correct endpoint path",
      ],
    };
  }

  if (msg.includes("http 401") || msg.includes("http 403")) {
    return {
      category: "authentication",
      userFriendlyMessage:
        "Authentication required: This server requires valid credentials.",
      suggestions: [
        "Check if you have a valid session ID or API key",
        "Contact the server administrator for authentication details",
        "Verify the authentication method required by this server",
      ],
    };
  }

  if (
    msg.includes("http 500") ||
    msg.includes("http 502") ||
    msg.includes("http 503")
  ) {
    return {
      category: "server_error",
      userFriendlyMessage:
        "Server error: The MCP server is experiencing issues.",
      suggestions: [
        "Try again in a few moments",
        "Contact the server administrator",
        "Check server status if available",
      ],
    };
  }

  // Check for specific authentication/session issues (but after HTTP codes)
  if (
    (msg.includes("session") &&
      (msg.includes("invalid") ||
        msg.includes("missing") ||
        msg.includes("required"))) ||
    msg.includes("unauthorized") ||
    (msg.includes("authentication") && !msg.includes("404"))
  ) {
    return {
      category: "authentication",
      userFriendlyMessage:
        "Authentication required: This server needs a session ID or authentication token.",
      suggestions: [
        "Check if you have a valid session ID",
        "Contact the server administrator for authentication details",
        "Verify the authentication method required by this server",
      ],
    };
  }

  if (msg.includes("cors") || msg.includes("cross-origin")) {
    return {
      category: "cors",
      userFriendlyMessage:
        "CORS error: Cross-origin request blocked by browser security.",
      suggestions: [
        "Using built-in proxy to resolve CORS issues",
        "Check if the server allows cross-origin requests",
        "Verify the server URL is correct",
      ],
    };
  }

  if (msg.includes("timeout") || msg.includes("took too long")) {
    return {
      category: "timeout",
      userFriendlyMessage:
        "Connection timeout: The server took too long to respond.",
      suggestions: [
        "Check your internet connection",
        "Try again in a few moments",
        "Verify the server is running and accessible",
      ],
    };
  }

  // Generic 404 check (fallback)
  if (msg.includes("not found") && !msg.includes("http")) {
    return {
      category: "not_found",
      userFriendlyMessage:
        "Server not found: The MCP endpoint doesn't exist at this URL.",
      suggestions: [
        "Double-check the server URL",
        "Verify the MCP endpoint path",
        "Contact the server administrator",
      ],
    };
  }

  if (msg.includes("network") || msg.includes("fetch")) {
    return {
      category: "network",
      userFriendlyMessage: "Network error: Unable to reach the MCP server.",
      suggestions: [
        "Check your internet connection",
        "Verify the server URL is correct",
        "Try again in a few moments",
      ],
    };
  }

  if (
    msg.includes("failed to establish") ||
    msg.includes("connection") ||
    msg.includes("eventsource")
  ) {
    return {
      category: "connection",
      userFriendlyMessage:
        "Connection failed: Unable to establish a connection to the MCP server.",
      suggestions: [
        "Verify the server URL and endpoint",
        "Check if the server supports SSE (Server-Sent Events)",
        "Ensure the server is running and accessible",
      ],
    };
  }

  return {
    category: "unknown",
    userFriendlyMessage: "Connection error: " + errorMessage,
    suggestions: [
      "Check the debug panel for more details",
      "Try testing the server URL directly",
      "Contact support if the issue persists",
    ],
  };
}
