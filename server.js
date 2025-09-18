const http = require("http");
const port = parseInt(process.env.PORT || "8080", 10);
const host = "0.0.0.0";

const server = http.createServer((req, res) => {
  console.log(
    `[SMOKE] TEST JURKOMASON ${new Date().toISOString()} ${req.method} ${
      req.url
    }`
  );
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("ok\n");
});

server.listen(port, host, () => {
  console.log(`[SMOKE] LISTEN ${host}:${port}`);
});
