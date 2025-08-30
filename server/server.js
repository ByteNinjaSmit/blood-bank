// server.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');

// Rate Limiter
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const redisClient = new Redis(process.env.REDIS_URL);



// Workers
const connectToDatabase = require("./config/db");
const logger = require('./utils/logger'); // Import the logger

// Import and initialize queues
// require('./queues/expiry-queue'); // This will start the expiry queue scheduler


// Middleware
const errorMiddleware = require("./middlewares/error-middleware");


// Import Routes
const authRoutes = require("./routers/auth-routes");
const siteRoutes = require("./routers/site-routes");
const donorRoutes = require("./routers/donor-routes");
const donationRoute = require('./routers/donation-routes');
const hospitalRoutes = require("./routers/hospital-routes");
const inventoryRoutes = require("./routers/inventory-routes");
const requestRoutes = require("./routers/request-routes");
const componentRoutes = require("./routers/component-routes");
const userRoutes = require("./routers/user-routes");
const discardRoutes = require("./routers/discard-routes");
const testRoutes = require('./routers/test-routes');


// Server Setup
// Server
const app = express();
const server = http.createServer(app);
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);
app.set("trust proxy", 1); // Trust first proxy (e.g., Nginx, Cloudflare)

app.use(cookieParser());

// Cors

const allowedOrigins = ["http://localhost:5173"];
const PORT = process.env.PORT || 5000;
// CORS Policy
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "DELETE", "PATCH", "HEAD", "PUT"],
        credentials: true,
    },
    pingInterval: 5000,
    pingTimeout: 20000,
    allowEIO3: true, // backward compatibility
    transports: ["websocket", "polling"],
    allowUpgrades: true,
    maxHttpBufferSize: 1e8,
    cookie: false,
    serveClient: false,
    
});

// Redis Adapter setup
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));


app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, origin); // ✅ Allow only one
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// DDos Protection
//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 100,
    duration: 30,
    blockDuration: 15,
});

app.use((req, res, next) => {
    rateLimiter
        .consume(req.ip)
        .then(() => next())
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({ success: false, message: "Too many requests" });
        });
});
//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator, // ✅ Safe for IPv6
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        skipFailedRequests: true,
    }),
});

// Make UploadFolder Static
// Serve static files from the uploads folder
app.use(
    "/database/uploads",
    express.static(path.join(__dirname, "database/uploads"), {
        setHeaders: (res, filePath) => {
            // Allow cross-origin requests
            res.set("Access-Control-Allow-Origin", "*"); // or set your frontend URL here
            res.set("Access-Control-Allow-Methods", "GET");
            res.set("Access-Control-Allow-Headers", "Content-Type");
            res.set("Access-Control-Expose-Headers", "Content-Length"); // Expose content length for media

            // Set content type based on the file extension
            if (filePath.endsWith(".mp4")) {
                res.set("Content-Type", "video/mp4"); // Set correct content type for video
            } else if (
                filePath.endsWith(".jpeg") ||
                filePath.endsWith(".jpg") ||
                filePath.endsWith(".png")
            ) {
                res.set("Content-Type", "image/jpeg"); // Set content type for images
            }
        },
    })
);



// Defining Routes & API
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    logger.info(`Request IP, ${req.ip}`);
    // console.log(`Incoming request: ${req.method} ${req.url} from ${req.ip}`);

    next();
});


// ==============================
// 📊 Health Check
// ==============================
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: true, // TODO: check DB status
      redis: !!process.env.REDIS_URL,
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      pdf: true,
    },
  });
});


// Routes Defining
app.get("/", (req, res) => {
    res.send("Welcome to the Blood Bank Management System API");
});

// Remaining Routes
app.use("/api/auth", authRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/donor",donorRoutes);
app.use('/api/donation',donationRoute);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/component", componentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/discard",discardRoutes);
app.use("/api/test",testRoutes);




// Broadcaster
app.set("io", io);




// Error Catch
app.use(errorMiddleware);

// ==============================
// 📡 Start Server
// ==============================
connectToDatabase()
  .then(() => {
    console.log("✅ MongoDB connected");
    logger.info("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Redis Running on ${process.env.REDIS_URL}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    logger.error("❌ MongoDB connection failed:", err.message);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (DB connection failed)`);
    });
  });

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("⏳ Shutting down server...");
  server.close(() => {
    console.log("✅ Server shut down gracefully");
    process.exit(0);
  });
});