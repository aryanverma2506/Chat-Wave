import MessageModel from "../models/message-model.js";

interface MessageData {
  sender: string;
  chatId: string;
  formattedText?: [];
  urlPreviewData?: Object;
  filename?: string;
}

export default async function storeMessage(messageData: MessageData) {
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
