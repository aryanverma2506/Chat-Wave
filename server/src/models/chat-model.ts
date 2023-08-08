import { Document, Schema, Types, model } from "mongoose";

import { MessageDocument } from "./message-model";
import { UserDocument } from "./user-model";

export interface ChatDocument extends Document {
  chatName?: string;
  isGroupChat: boolean;
  users: UserDocument[];
  latestMessage: MessageDocument;
  groupAdmins: UserDocument[];
  profilePic?: string;
}

function hasNoDuplicates(array: (Types.ObjectId | UserDocument)[]): boolean {
  if (!Array.isArray(array)) return false; // Skip validation for undefined (default) value
  const set = new Set<string>(); // Check for uniqueness using Set
  for (const element of array) {
    const strElement = element.toString();
    if (set.has(strElement)) {
      return false;
    }
    set.add(strElement);
  }
  return true;
}

const chatSchema = new Schema<ChatDocument>(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: {
      type: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
      validate: {
        validator: hasNoDuplicates,
        message: "Duplicate Users found!",
      },
    },
    latestMessage: {
      type: Types.ObjectId,
      ref: "Message",
    },
    groupAdmins: {
      type: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
      default: undefined,
      validate: {
        validator: hasNoDuplicates,
        message: "Duplicate Admins found!",
      },
    },
    profilePic: {
      type: String,
      default: function (this: ChatDocument) {
        if (this.isGroupChat) {
          return "assets/profilePic/default-group-pic.png";
        }
        return undefined;
      },
    },
  },
  { timestamps: true }
);

const ChatModel = model<ChatDocument>("Chat", chatSchema);

export default ChatModel;
