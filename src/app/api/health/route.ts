import { NextResponse } from "next/server";

const logHealthPing = (method: string) => {
  console.log(
    `[health] ${method} ${new Date().toISOString()} port=${
      process.env.PORT ?? "unknown"
    } hostname=${process.env.HOSTNAME ?? "unknown"}`
  );
};

export async function GET(_request: Request) {
  logHealthPing("GET");
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "mcp-swagger",
      version: "1.0.0",
      region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? null,
    },
    { status: 200 }
  );
}

export async function HEAD(_request: Request) {
  logHealthPing("HEAD");
  return new Response(null, { status: 200 });
}
