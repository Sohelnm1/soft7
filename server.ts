import { createServer } from "http";
import next from "next";
import { initSocket } from "./src/lib/socket";
import { initSocketBridge } from "./src/lib/socket-bridge";
import { initReminderCron } from "./src/jobs/reminderCron";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handler(req, res);
  });

  const io = initSocket(server);
  console.log("🔌 Socket.IO initialized");

  // Initialize Redis bridge for worker -> socket communication
  initSocketBridge(io);

  // Initialize background jobs
  initReminderCron();

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 Socket.IO ready for connections`);
  });
});

