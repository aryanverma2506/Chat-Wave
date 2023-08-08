import { Schema, Types, model } from "mongoose";
const messageSchema = new Schema({
    sender: {
        type: Types.ObjectId,
        ref: "User",
    },
    chat: {
        type: Types.ObjectId,
        ref: "Chat",
    },
    content: { formattedText: Array, urlPreviewData: Object, filename: String },
}, { timestamps: true });
const MessageModel = model("Message", messageSchema);
export default MessageModel;
