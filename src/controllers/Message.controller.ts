// controllers/Message.controller.ts
import { Server } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      io?: Server;
    }
  }
}

import { Request, Response } from "express";
import { Message } from "../models/Message.model";
import Group from "../models/Group.model";

// export const sendMessage = async (req: Request, res: Response) => {
//   try {
//     const { text, groupId, sender, file } = req.body;

//     console.log(req.body, "Request body for sending message");
//     // From auth middleware
//     const userName = req.body.senderName; // From auth middleware

//     // Check if user is member of the group
//     const group = await Group.findById(groupId);
//     if (!group) {
//       return res.status(404).json({ error: "Group not found" });
//     }

//     if (!group.members.includes(sender)) {
//       return res
//         .status(403)
//         .json({ error: "You must join the group to send messages" });
//     }

//     const newMessage = new Message({
//       sender,
//       text,
//       groupId,
//       senderName: userName,
//       file: file || null,
//     });

//     await newMessage.save();

//     // Emit socket event
//     if (req.io) {
//       req.io.to(groupId).emit("group-message", newMessage);
//     } else {
//       console.warn("Socket.io instance not available on request");
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error sending message:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text, groupId, sender, file } = req.body;

    console.log(req.body, "Request body for sending message");

    const userName = req.body.senderName;

    // Check if user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.includes(sender)) {
      return res
        .status(403)
        .json({ error: "You must join the group to send messages" });
    }

    // Prepare message data
    const messageData: any = {
      sender,
      groupId,
      senderName: userName,
    };

    // Add text if provided and not empty
    if (text && text.trim() !== "") {
      messageData.text = text.trim();
    }

    // Add file if provided
    if (file && file.url && file.type) {
      messageData.fileUrl = file.url;
      messageData.fileType = file.type;
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Emit socket event
    if (req.io) {
      req.io.to(groupId).emit("group-message", newMessage);
    } else {
      console.warn("Socket.io instance not available on request");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.query.userId as string; // Optional for private groups

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Public groups allow anyone to view messages
    if (!group.isPublic && (!userId || !group.members.includes(userId))) {
      return res.status(403).json({ error: "Unauthorized to view messages" });
    }

    const messages = await Message.find({ groupId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
