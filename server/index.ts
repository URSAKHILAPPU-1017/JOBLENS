import { createServer } from "http";
import { app } from "./app";

const port = Number(process.env.PORT) || (process.env.NODE_ENV === "production" ? 3000 : 3001);
const server = createServer(app);

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[JOBLENS API Server Error] Port ${port} is already in use.`);
    console.error(`Please stop the process using port ${port} or free up the port before running pnpm dev.`);
  } else {
    console.error(`[JOBLENS API Server Error]`, err);
  }
  process.exit(1);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[JOBLENS API Server] Running on http://localhost:${port}/ (0.0.0.0:${port})`);
});
