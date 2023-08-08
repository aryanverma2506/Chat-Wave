import { DeltaOperation } from "quill";

export interface MessagesModel {
  readonly messageId: string;
  readonly sender: string;
  readonly chat: string;
  readonly content: {
    readonly formattedText?: DeltaOperation[] | null;
    readonly urlPreviewData?: any;
    readonly filename?: string;
  };
  readonly imageURL?: boolean;
}

export interface MessagesObject {
  [chatId: string]: MessagesModel[];
}
