import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer } from "http";
// import { Server } from "socket.io";
// import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from 'xss-clean';

import authRoutes from "./server/routes/authRoutes.js";
import orderRoutes from "./server/routes/orderRoutes.js";
import adminRoutes from "./server/routes/adminRoutes.js";
import connectDB from "./server/config/db.js";

const app = express();
const httpServer = createServer(app);

// Trust proxy for Vercel (required for rate limiting)
app.set("trust proxy", 1);

// 1. Synchronous Middlewares
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

app.use(limiter);
app.use(xss());
app.use(express.json());

// 2. Synchronous Routes (Required for Vercel Serverless Functions)
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// 3. Asynchronous Server Initialization (for DB and Vite)
async function startServer() {
  // Initialize Database (Async, but doesn't block route definition)
  await connectDB();
  
  const PORT = Number(process.env.PORT) || 3000;

  // Development: Vite Middleware for frontend
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // Static file serving fallback for production (Vercel typically handles this, but good fallback)
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

// Start async initialization
startServer();

// Immediate synchronous export of the Express app (Vercel expects routes to be bound already)
export default app;