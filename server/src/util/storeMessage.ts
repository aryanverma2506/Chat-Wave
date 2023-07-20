import MessageModel from "../models/message-model.js";

interface MessageData {
  sender: string;
  recipient: string;
  formattedText?: string;
  urlPreviewData?: Object;
  filename?: string;
}

export default async function storeMessage(messageData: MessageData) {
  const message = new MessageModel({
    sender: messageData.sender,
    recipient: messageData.recipient,
    formattedText: messageData.formattedText,
  });
  messageData.formattedText &&
    (message.formattedText = messageData.formattedText);
  messageData.filename && (message.filename = messageData.filename);
  messageData.urlPreviewData &&
    (message.urlPreviewData = messageData.urlPreviewData);
  await message.save();
  return message;
}
