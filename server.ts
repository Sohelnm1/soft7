import { createServer } from "http";
import next from "next";
import { initSocket } from "./src/lib/socket";

const port = 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handler(req, res);
  });

  initSocket(server);

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
