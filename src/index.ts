import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/Auth.route";
import http from "http";
import { Server } from "socket.io";
import GroupRouter from "./routes/Group.route";
import MessageRouter from "./routes/Message.route";
import { User } from "./models/user";

// Declare module augmentation for Express Request
declare module "express" {
  interface Request {
    io?: Server;
  }
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate critical environment variables
const requiredEnvVars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY",
  "AWS_SECRET_KEY",
  "S3_BUCKET_NAME",
  "MONGODB_URI",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(
    "Missing required environment variables:",
    missingVars.join(", ")
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-group", (groupId: string) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on("leave-group", (groupId: string) => {
    socket.leave(groupId);
    console.log(`User ${socket.id} left group ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Add io instance to request object
app.use((req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// User lookup endpoint
app.get("/api/users", async (req: Request, res: Response) => {
  const email = req.query.email as string;

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  try {
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signed URL generation endpoint
app.get("/api/upload/signed-url", async (req: Request, res: Response) => {
  const { fileName, fileType } = req.query as {
    fileName?: string;
    fileType?: string;
  };

  if (!fileName || !fileType) {
    return res.status(400).json({
      error: "Both fileName and fileType query parameters are required",
    });
  }

  try {
    const fileExt = fileName.split(".").pop();
    const key = `uploads/${uuidv4()}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ACL: "public-read",
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ signedUrl, fileUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", GroupRouter);
app.use("/api/messages", MessageRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
