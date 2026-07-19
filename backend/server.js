// ✅ 1. ES6 Imports Only (No require())
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ✅ 2. Setup Paths (ES6 Module Compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 3. Load .env BEFORE importing modules that use it
dotenv.config({ path: path.resolve(__dirname, ".env") });

// ✅ 4. Import ENV (After dotenv)
import { ENV } from "./lib/env.js";

// ✅ 5. Initialize App (Only Once)
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || ENV.PORT || 10000);

// ✅ 6. CORRECT CORS SETUP (Render-Ready, with Login/Auth)
const allowedOrigins = [
  ENV.CLIENT_URL, // Your frontend's production URL (e.g., "https://your-frontend.vercel.app")
  "http://localhost:10000", // Local dev
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:10000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  process.env.RENDER_EXTERNAL_URL || "https://your-backend.onrender.com", // Auto-detect Render backend URL
  "https://netchillstreamingservice.vercel.app", // Replace with your actual frontend URL
].filter(Boolean);

const isDevelopment = ENV.NODE_ENV !== 'production';
const isAllowedOrigin = (origin) => {
  if (!origin || origin === "null") return true;
  if (isDevelopment) return true;

  const normalizedOrigin = origin.toLowerCase();
  return allowedOrigins.some((allowedOrigin) => allowedOrigin.toLowerCase() === normalizedOrigin) ||
    normalizedOrigin.includes(".vercel.app") ||
    normalizedOrigin.includes(".render.com") ||
    normalizedOrigin.includes("localhost") ||
    normalizedOrigin.includes("127.0.0.1");
};

app.use(cors({
  origin: (origin, callback) => {
    // ✅ Allow requests with no origin (curl, Postman, mobile apps)
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy does not allow access from ${origin}`), false);
  },
  credentials: true, // ✅ Required for login sessions/cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Device-Id", "X-Requested-With"],
}));

// ✅ 7. Middleware (After CORS)
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// ✅ 8. Import Routes (After Middleware)
import { connectDB } from "./lib/db.js";
import { startSubscriptionRenewalJob } from "./jobs/subscriptionRenewal.job.js";
import authRoute from "./auth.route.js";
import adminRoute from "./route/admin.route.js";
import billingRoute from "./route/billing.route.js";
import sseRoute from "./route/sse.route.js";

// ✅ 9. API Routes
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/billing", billingRoute);
app.use("/api/sse", sseRoute);
import moviesRoute from "./route/movies.route.js";

app.use("/api/movies", moviesRoute);

app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// ✅ 10. Root Path
const FRONTEND_ROOT = path.join(__dirname, "../frontend");

app.get('/', (req, res) => {
  const indexPath = path.join(FRONTEND_ROOT, "index.html");
  if (existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('API is active and running');
});

// ✅ 12. Frontend Serving (unchanged)
const ROUTE_TO_PAGE = {
  "/": "index.html",
  "/login": "login.html",
  "/signup": "login.html",
  "/dashboard": "dashboard.html",
  "/account": "account.html",
  "/admin": "admin.html",
  "/reset-password": "reset-password.html",
};

function resolveFrontendPage(requestPath) {
  const cleanPath = requestPath.split("?")[0].split("#")[0];
  const normalizedPath = cleanPath.replace(/\/$/, "");
  return ROUTE_TO_PAGE[normalizedPath || "/"] || null;
}

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/frontend/")) {
    const cleanFile = req.path.replace(/^\/frontend\//, "");
    const filePath = path.join(FRONTEND_ROOT, cleanFile);
    if (existsSync(filePath)) return res.sendFile(filePath);
}
  return next();
});

app.use(express.static(FRONTEND_ROOT, { index: false, extensions: ["html"] }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  if (req.method !== "GET") return next();

  const pageFile = resolveFrontendPage(req.path);
  if (pageFile) {
    const fullPath = path.join(FRONTEND_ROOT, pageFile);
    if (existsSync(fullPath)) return res.sendFile(fullPath);
  }

  const errorPage = path.join(FRONTEND_ROOT, "404.html");
  if (existsSync(errorPage)) {
    return res.status(404).sendFile(errorPage);
  } else {
    return res.status(404).send("<h1>404 - Page Not Found</h1><a href='/'>Go Home</a>");
  }
});

// ✅ 13. Start Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port: ${PORT}`);
      if (typeof startSubscriptionRenewalJob === "function") {
        startSubscriptionRenewalJob();
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();