import { Document, Schema, Types, model } from "mongoose";

import { ChatDocument } from "./chat-model";
import { UserDocument } from "./user-model";
export interface MessageDocument extends Document {
  sender: UserDocument;
  chat: ChatDocument;
  content: {
    formattedText: [];
    urlPreviewData: Object;
    filename: string;
  };
}

const messageSchema = new Schema<MessageDocument>(
  {
    sender: {
      type: Types.ObjectId,
      ref: "User",
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
    },
    content: { formattedText: Array, urlPreviewData: Object, filename: String },
  },
  { timestamps: true }
);

const MessageModel = model<MessageDocument>("Message", messageSchema);

export default MessageModel;
