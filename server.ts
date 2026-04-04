import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer } from "http";
// import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from 'xss-clean';

import authRoutes from "./server/routes/authRoutes";
import orderRoutes from "./server/routes/orderRoutes";
import adminRoutes from "./server/routes/adminRoutes";
import connectDB from "./server/config/db";

const app = express();
const httpServer = createServer(app);

// Socket.IO Setup Removed for Vercel Compatibility (Supabase Realtime is used instead)
/*
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
*/

async function startServer() {
  // Initialize Database
  await connectDB();
  
  const PORT = Number(process.env.PORT) || 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  }));
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all requests
  app.use(limiter);

  // Data Sanitization against XSS
  app.use(xss());

  app.use(express.json());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);

  // Socket.IO connection (Handled by Supabase)
  /*
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
  */

  // Development: Vite Middleware
  if (process.env.NODE_ENV !== "production") {

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);

  } else {

    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err.stack);
    
    // Hide DB errors and stack traces from the user
    const status = err.status || 500;
    const message = process.env.NODE_ENV === "production" 
      ? "An internal server error occurred" 
      : err.message || "Internal Server Error";

    res.status(status).json({
      success: false,
      message,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;