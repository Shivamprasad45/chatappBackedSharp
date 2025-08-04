// import { Request, Response } from "express";
// import Message from "../models/Message.model";
// import NodeCache from "node-cache";
// const cache = new NodeCache({ stdTTL: 60 }); // Cache TTL is 60 seconds
// export const messagereciver = async function (msg: any) {
//   await Message.create({
//     sender: msg.sender,
//     text: msg.text,
//   });
// };

// export const BoardCastMessage = async function (req: Request, res: Response) {
//   try {
//     const cachedMessages = cache.get("messages");
//     if (cachedMessages) {
//       console.log("Serving from cache");
//       return res.json(cachedMessages);
//     }
//     const messages = await Message.find().sort({ createdAt: 1 });
//     console.log("Serving from database");
//     cache.set("messages", messages); // Cache the messages
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// };
