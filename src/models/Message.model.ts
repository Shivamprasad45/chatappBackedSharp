import mongoose, { Schema, Document } from "mongoose";

interface IMessage extends Document {
  sender: string;
  text?: string;
  groupId: string;
  senderName: string;
  fileUrl?: string;
  fileType?: "image" | "video" | "document" | "audio";
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: false,
  },
  groupId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: false,
  },
  fileType: {
    type: String,
    enum: ["image", "video", "document", "audio"],
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Add validation to ensure either text or file is provided
MessageSchema.pre("validate", function () {
  if (!this.text && !this.fileUrl) {
    this.invalidate("text", "Either text or file must be provided");
  }
});

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
