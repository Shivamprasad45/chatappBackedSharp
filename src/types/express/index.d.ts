// types/express/index.d.ts
import { Server as SocketIOServer } from "socket.io";

declare module "express-serve-static-core" {
  interface Request {
    io?: SocketIOServer;
  }
}
