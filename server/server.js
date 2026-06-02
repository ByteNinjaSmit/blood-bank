const dotenv = require("dotenv");
const dns = require("node:dns");
// Fix for MongoDB Atlas DNS resolution issues on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder("ipv4first");
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

// Import and initialize legacy queues.
// NOTE: email-otp queue retired — OTP email now flows through the new
// notification queue (src/modules/notification). Expiry/discard legacy
// queues remain for the legacy BloodBag collection; the new
// bloodUnits collection is handled by src/modules/inventory jobs.
require('./queues/expiry-queue');
require('./queues/discard-queue');
require('./queues/birthday-queue'); // initialize Birthday SMS queue


// Middleware
const errorMiddleware = require("./middlewares/error-middleware");
const requestId = require("./middlewares/request-id");
const httpLogger = require("./middlewares/http-logger");


// Import Routes
// NOTE: legacy /api/auth retired — auth now served by /api/v2/auth
// (see src/modules/auth). The old router file remains on disk but is
// no longer mounted.
const siteRoutes = require("./routers/site-routes");
const donorRoutes = require("./routers/donor-routes");
const donationRoute = require('./routers/donation-routes');
const hospitalRoutes = require("./routers/hospital-routes");
const inventoryRoutes = require("./routers/inventory-routes");
const requestRoutes = require("./routers/request-routes");
const componentRoutes = require("./routers/component-routes");
const userRoutes = require("./routers/user-routes");
const discardRoutes = require("./routers/discard-routes");
const labRoutes = require('./routers/lab-routes');
const testRoutes = require('./routers/test-routes');
const adminRoutes = require('./routers/admin-routes');
const dashboardRoutes = require('./routers/dashboard-routes');
const misRoutes = require('./routers/mis-routes');
const appointmentRoutes = require('./routers/appointment-routes');


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

// Request correlation id + structured request/response logging.
// Must come before any other middleware that may log so every line
// carries the same req.id.
app.use(requestId);
app.use(httpLogger);

app.use(cookieParser());

// Cors

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://sanjivanibloodbank.org",
    "https://www.sanjivanibloodbank.org",
    "https://system.sanjivanibloodbank.org",
];

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


const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],
};

app.use(cors(corsOptions));


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



// (request/response logging handled by httpLogger above; request bodies
// are intentionally NOT logged at INFO level to avoid PHI/PII leakage —
// add an opt-in audit middleware on a per-route basis if needed.)

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

// ---------------------------------------------------------------------
// New SOLID/TypeScript tree mounted at /api/v2/* (side-by-side rebuild).
// Built artifacts live under ./dist (produced by `npm run build`).
// Skipped with a warning if the build is missing so dev can still run
// the legacy routes without TypeScript installed.
// ---------------------------------------------------------------------
try {
    const { registerRoutes } = require("./dist/routes");
    app.use("/api/v2", registerRoutes());
    logger.info({ mount: "/api/v2" }, "v2 module routes mounted");

    // Wire the new tree's Bull processors (email queue, etc.) onto the
    // legacy process. DB is shared (same mongoose singleton already
    // connected by connectToDatabase below).
    try {
        const { registerProcessors } = require("./dist/core/queue/register-processors");
        registerProcessors();
        logger.info("v2 queue processors registered");
    } catch (procErr) {
        logger.warn({ err: procErr.message }, "v2 processors not registered");
    }
} catch (err) {
    logger.warn(
        { err: err.message },
        "v2 routes not mounted (run `npm run build` to enable /api/v2)",
    );
}

// Remaining Routes
// (legacy /api/auth retired — now /api/v2/auth)
app.use("/api/site", siteRoutes);
app.use("/api/donor", donorRoutes);
app.use('/api/donation', donationRoute);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/component", componentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/discard", discardRoutes);
app.use('/api/serology', labRoutes);
app.use("/api/test", testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mis', misRoutes);
app.use('/api/appointments', appointmentRoutes);




// Broadcaster
app.set("io", io);




// Error Catch
app.use(errorMiddleware);

// ==============================
// 📡 Start Server
// ==============================
connectToDatabase()
    .then(() => {
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