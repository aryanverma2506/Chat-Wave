import { Schema, model } from "mongoose";
const messageSchema = new Schema({
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
}, { timestamps: true });
const MessageModel = model("Message", messageSchema);
export default MessageModel;
