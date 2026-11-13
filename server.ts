import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    }
  });
  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('clear_notification', (data) => {
      console.log(`User cleared notification for ${data.id}`);
      // In a real app we'd update the DB. Here we confirm receiving.
      socket.emit('notification_cleared', { id: data.id });
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();