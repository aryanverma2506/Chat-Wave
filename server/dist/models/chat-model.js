import { Schema, Types, model } from "mongoose";
function hasNoDuplicates(array) {
    if (!Array.isArray(array))
        return false; // Skip validation for undefined (default) value
    const set = new Set(); // Check for uniqueness using Set
    for (const element of array) {
        const strElement = element.toString();
        if (set.has(strElement)) {
            return false;
        }
        set.add(strElement);
    }
    return true;
}
const chatSchema = new Schema({
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
        default: function () {
            if (this.isGroupChat) {
                return "assets/profilePic/default-group-pic.png";
            }
            return undefined;
        },
    },
}, { timestamps: true });
const ChatModel = model("Chat", chatSchema);
export default ChatModel;
