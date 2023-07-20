import { Document, Schema, model } from "mongoose";

interface MessageDocument extends Document {
  sender: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  formattedText: string;
  urlPreviewData: Object;
  filename: string;
}

const messageSchema = new Schema<MessageDocument>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    formattedText: Array,
    urlPreviewData: Object,
    filename: String,
  },
  { timestamps: true }
);

const MessageModel = model<MessageDocument>("Message", messageSchema);

export default MessageModel;
