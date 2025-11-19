// Wrapper to ensure Next's standalone server binds to all interfaces.
// AppRunner injects a HOSTNAME env (e.g. ip-10-0-xx), which Next will use,
// preventing the health checker from reaching 127.0.0.1. Force it back to 0.0.0.0.

process.env.PORT = process.env.PORT || "8080";

const desiredHost = "0.0.0.0";

if (process.env.HOSTNAME !== desiredHost) {
  console.log(
    `[entry] Forcing HOSTNAME from "${process.env.HOSTNAME}" to "${desiredHost}"`
  );
  process.env.HOSTNAME = desiredHost;
}

// Some tooling reads HOST instead of HOSTNAME.
process.env.HOST = desiredHost;

// Delegate to the Next.js standalone server generated at build time.
require("./server.js");


