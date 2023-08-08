import MessageModel from "../models/message-model.js";
export default async function storeMessage(messageData) {
    const message = new MessageModel({
        sender: messageData.sender,
        chat: messageData.chatId,
        formattedText: messageData.formattedText,
    });
    messageData.formattedText &&
        (message.content.formattedText = messageData.formattedText);
    messageData.filename && (message.content.filename = messageData.filename);
    messageData.urlPreviewData &&
        (message.content.urlPreviewData = messageData.urlPreviewData);
    message;
    return message.save();
}
