import { NextRequest } from "next/server";
import { Readable } from "stream";

/**
 * Creates Express-compatible request/response mocks for StreamableHTTPServerTransport
 */
export function createExpressMocks(
  request: NextRequest,
  body?: string,
  parsedBody?: any
) {
  // Create a readable stream from the body
  const bodyStream = new Readable({
    read() {
      if (body) {
        this.push(body);
        this.push(null);
      } else {
        this.push(null);
      }
    },
  });

  // Mock Express Request
  const mockReq = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: parsedBody,

    // Stream methods
    readable: true,
    readableEnded: false,
    pipe: (destination: any) => {
      bodyStream.pipe(destination);
      return destination;
    },
    on: (event: string, handler: Function) => {
      bodyStream.on(event, handler as any);
      return mockReq;
    },
    once: (event: string, handler: Function) => {
      bodyStream.once(event, handler as any);
      return mockReq;
    },
    emit: (event: string, ...args: any[]) => {
      return bodyStream.emit(event, ...args);
    },

    // Additional Express methods
    get: (header: string) => {
      return request.headers.get(header.toLowerCase());
    },
    header: (header: string) => {
      return request.headers.get(header.toLowerCase());
    },

    // Async body parsers
    text: async () => body || "",
    json: async () => parsedBody,

    // Other Express properties
    protocol: new URL(request.url).protocol.replace(":", ""),
    secure: new URL(request.url).protocol === "https:",
    ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
    ips: [],
    subdomains: [],
    path: new URL(request.url).pathname,
    hostname: new URL(request.url).hostname,
    host: new URL(request.url).host,
    fresh: false,
    stale: true,
    xhr: false,

    // Query and params
    query: Object.fromEntries(new URL(request.url).searchParams),
    params: {},

    // Other methods
    is: (type: string) => {
      const contentType = request.headers.get("content-type") || "";
      return contentType.includes(type);
    },
    accepts: (types: string | string[]) => {
      // Simple implementation
      return Array.isArray(types) ? types[0] : types;
    },
  } as any;

  return mockReq;
}

/**
 * Creates an Express-compatible response mock that collects data and returns a NextResponse
 */
export function createExpressResponse(
  onComplete: (data: { status: number; headers: Headers; body: string }) => void
) {
  let statusCode = 200;
  const headers = new Headers();
  const chunks: Buffer[] = [];
  let headersSent = false;
  let finished = false;

  const mockRes = {
    // Status methods
    statusCode,
    statusMessage: "OK",

    status: function (code: number) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },

    sendStatus: function (code: number) {
      this.status(code);
      this.end();
      return this;
    },

    // Header methods
    headersSent,

    setHeader: function (name: string, value: string | string[]) {
      if (headersSent) return this;
      if (Array.isArray(value)) {
        headers.set(name, value.join(", "));
      } else {
        headers.set(name, value);
      }
      return this;
    },

    getHeader: function (name: string) {
      return headers.get(name);
    },

    removeHeader: function (name: string) {
      headers.delete(name);
      return this;
    },

    writeHead: function (
      code: number,
      statusMessage?: string | any,
      headers?: any
    ) {
      if (headersSent) return this;

      statusCode = code;
      this.statusCode = code;

      if (typeof statusMessage === "string") {
        this.statusMessage = statusMessage;
      } else if (statusMessage) {
        headers = statusMessage;
      }

      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          this.setHeader(key, value as string);
        });
      }

      headersSent = true;
      this.headersSent = true;
      return this;
    },

    // Flush headers method (required by some middleware)
    flushHeaders: function () {
      if (!headersSent) {
        this.writeHead(statusCode);
      }
      return this;
    },

    // Write methods
    write: function (chunk: any, encoding?: string) {
      if (finished) return false;
      if (!headersSent) {
        this.writeHead(statusCode);
      }

      let buffer: Buffer;
      if (Buffer.isBuffer(chunk)) {
        buffer = chunk;
      } else if (typeof chunk === "string") {
        buffer = Buffer.from(chunk, (encoding as any) || "utf8");
      } else {
        buffer = Buffer.from(JSON.stringify(chunk));
      }

      chunks.push(buffer);
      return true;
    },

    end: function (data?: any, encoding?: string) {
      if (finished) return this;

      if (data) {
        this.write(data, encoding);
      }

      if (!headersSent) {
        this.writeHead(statusCode);
      }

      finished = true;
      this.finished = true;

      // Trigger completion
      const body = Buffer.concat(chunks).toString("utf8");
      onComplete({
        status: statusCode,
        headers,
        body,
      });

      return this;
    },

    // JSON methods
    json: function (obj: any) {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(obj));
      return this;
    },

    // Send methods
    send: function (body: any) {
      if (typeof body === "object" && !Buffer.isBuffer(body)) {
        return this.json(body);
      }
      this.end(body);
      return this;
    },

    // Stream methods
    pipe: function () {
      throw new Error("Response piping not supported in mock");
    },

    // Other properties
    finished,
    connection: {
      remoteAddress: "127.0.0.1",
    },
    socket: {
      remoteAddress: "127.0.0.1",
    },

    // Event emitter methods (minimal implementation)
    on: function (event: string, handler: Function) {
      return this;
    },

    once: function (event: string, handler: Function) {
      return this;
    },

    emit: function (event: string, ...args: any[]) {
      return true;
    },

    // Other Express methods
    set: function (field: string, value?: string) {
      if (arguments.length === 2) {
        this.setHeader(field, value!);
      }
      return this;
    },

    get: function (field: string) {
      return this.getHeader(field);
    },

    type: function (type: string) {
      this.setHeader("Content-Type", type);
      return this;
    },

    links: function (links: any) {
      // Not implemented
      return this;
    },

    location: function (url: string) {
      this.setHeader("Location", url);
      return this;
    },

    redirect: function (status: number | string, url?: string) {
      if (typeof status === "string") {
        url = status;
        status = 302;
      }
      this.status(status as number);
      this.location(url!);
      this.end();
      return this;
    },

    vary: function (field: string) {
      // Not implemented
      return this;
    },

    // Required for some middleware
    locals: {},
    app: {},
  } as any;

  return mockRes;
}
