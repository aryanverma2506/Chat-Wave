import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import { DeltaStatic, RangeStatic, Sources } from "quill";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import Input from "../Input/Input";
import Button from "../Button/Button";
import Contact from "../Contact/Contact";
import { useHttpClient } from "../../hooks/useHttpClient-hook";
import {
  DirectChatModel,
  DirectChatObject,
} from "../../models/directChat.model";
import { GroupChatModel } from "../../models/groupChat.model";
import "./ChatInput.css";

const icons = Quill.import("ui/icons");
icons[
  "bold"
] = `<span class="ql-formats-icon my-2 pl-1 pr-2"><i class="fa-solid fa-bold" /></span>`;
icons[
  "italic"
] = `<span class="ql-formats-icon my-2 px-1"><i class="fa-thin fa-italic" /></span>`;
icons[
  "strike"
] = `<span class="ql-formats-icon my-2 pl-1 pr-3 border-r border-gray-500"><i class="fa-light fa-strikethrough" /></span>`;
icons[
  "link"
] = `<span class="ql-formats-icon my-2 pl-1 pr-3 border-r border-gray-500"><i class="fa-light fa-link" /></span>`;
icons["list"][
  "ordered"
] = `<span class="ql-formats-icon my-2 pl-2 pr-2"><i class="fa-light fa-list-ol"></i></span>`;
icons["list"][
  "unordered"
] = `<span class="ql-formats-icon my-2 pl-2 pr-3 border-r border-gray-500"><i class="fa-light fa-solid fa-list-ul"></i></span>`;
icons[
  "blockquote"
] = `<span class="ql-formats-icon my-2 px-3 border-r border-gray-500"><i class="fa-light fa-block-quote"></i></span>`;
icons[
  "code"
] = `<span class="ql-formats-icon my-2 pl-2 pr-2"><i class="fa-light fa-code"></i></span>`;
icons[
  "code-block"
] = `<span class="ql-formats-icon my-2 pl-3"><i class="fa-light fa-square-code"></i></span>`;

interface ChatInputProps extends React.PropsWithChildren {
  chatInfo: GroupChatModel | DirectChatModel | null;
  fileChangeHandler: (file: File) => void;
  onSubmit: (
    event: React.FormEvent,
    chatInput: DeltaStatic | undefined,
    urlPreviewData: any | null,
    callback?: () => void
  ) => void;
}

function isValidURL(url: string) {
  const urlPattern = new RegExp(
    "^((http|https|ftp)://)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP (IPv4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return urlPattern.test(url);
}

const ChatInput: React.FC<ChatInputProps> = (props) => {
  const { chatInfo, fileChangeHandler, onSubmit } = props;

  const [editorHtml, setEditorHtml] = useState<string>("");
  const [editorContent, setEditorContent] = useState<DeltaStatic>();
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [mentionSuggestions, setMentionSuggestions] =
    useState<DirectChatObject>({});
  const [previewData, setPreviewData] = useState<any | null>(null);

  const mentionChars = ["@"];
  const quillRef = useRef<ReactQuill>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const { sendRequest } = useHttpClient();

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current?.contains(event.target as Node)
    ) {
      setShowEmojiPicker(false);
    }
  }, []);

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      if (clipboardData) {
        const pastedData = clipboardData.getData("text/plain");
        if (isValidURL(pastedData) && !previewData) {
          try {
            const metadata = await sendRequest({
              url: `https://getlinkpreview.onrender.com/?url=${pastedData}`,
              customUrl: true,
            });
            setPreviewData(() => ({ ...metadata, url: pastedData }));
          } catch (error) {
            console.error("Error fetching webpage metadata:", error);
            setPreviewData(() => null);
          }
        }
      }
    },
    [previewData, sendRequest]
  );

  useEffect(() => {
    window.addEventListener("click", handleOutsideClick);
    let container: HTMLDivElement;
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      container = editor.root;
      if (container) {
        container.addEventListener("paste", handlePaste);
      }
    }

    return () => {
      window.removeEventListener("click", handleOutsideClick);
      if (container) {
        container.removeEventListener("paste", handlePaste);
      }
    };
  }, [handleOutsideClick, handlePaste]);

  function emojiHandler(emoji: any) {
    if (quillRef.current) {
      const range = quillRef.current.getEditor().getSelection(true);
      quillRef.current.getEditor().insertText(range.index, emoji.native);
      quillRef.current
        .getEditor()
        .setSelection(range.index + emoji.native.length);
    }
  }

  function searchMentionsHandler(searchTerm: string) {
    if (chatInfo && chatInfo.isGroupChat && chatInfo.users?.length) {
      const filteredUsers: DirectChatObject = {};

      for (const user of chatInfo.users) {
        if (
          user.name &&
          user.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          filteredUsers[user._id] = user;
        }
      }

      setMentionSuggestions(() => filteredUsers);
    }
  }

  function insertMentionHandler(mention: string) {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const cursorPosition = editor.getSelection(true)?.index;
      const currentText = editor.getText();

      let mentionStartIndex = cursorPosition;
      while (
        mentionStartIndex > 0 &&
        currentText[mentionStartIndex - 1] !== "@"
      ) {
        --mentionStartIndex;
      }

      editor.deleteText(mentionStartIndex, cursorPosition - mentionStartIndex);

      editor.insertText(mentionStartIndex, `${mention} `);

      editor.setSelection(
        (mentionStartIndex + mention.length + 2) as unknown as RangeStatic
      );
    }
  }

  function enterKeyHandler() {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const cursorPosition = editor.getSelection(true)?.index;

      editor.deleteText(cursorPosition - 1, 1);
    }
  }

  function atSymbolHandler() {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const currentText = editor.getText();
      const cursorPosition = editor.getSelection(true)?.index;

      const lastCharTyped = cursorPosition
        ? currentText.charAt(cursorPosition - 1)
        : "";
      if (mentionChars.includes(lastCharTyped)) {
        editor.deleteText(cursorPosition - 1, 1);
      } else {
        editor.insertText(cursorPosition, "@");
      }
    }
  }

  function findRemovedURL(
    currentDelta?: DeltaStatic,
    previousDelta?: DeltaStatic
  ) {
    if (!currentDelta || !previousDelta) {
      return null;
    }

    const ops = currentDelta.ops;
    const oldOps = previousDelta.ops;
    if (ops && oldOps && previewData) {
      for (let i = 0; i < ops.length; ++i) {
        if (ops[i]?.delete && !oldOps[i]?.delete) {
          if (previewData.url.trim() === oldOps[i]?.insert.trim()) {
            return true;
          }
        }
      }
    }
    return null;
  }

  async function editorChangeHandler(
    callback?: () => void,
    content?: string,
    delta?: DeltaStatic,
    source?: Sources,
    editor?: ReactQuill.UnprivilegedEditor
  ) {
    if (callback) {
      return callback();
    }
    setEditorHtml(() => content || "");
    if (source === "user") {
      const removedURL = findRemovedURL(delta, editorContent); // we need previous editorContent not the updated one hence the setEditorContent is defined after this check
      if (removedURL) {
        setPreviewData(() => null);
      }
    }
    setEditorContent(() => editor?.getContents());
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const currentText = editor.getText();
      const cursorPosition = editor.getSelection(true)?.index;

      const selection = editor.getSelection();
      if (selection && selection.length === 0) {
        const link = editor.getFormat(selection.index, selection.length);
        if (link && link.link) {
          try {
            const metadata = await sendRequest({
              url: `https://getlinkpreview.onrender.com/?url=${link.link}`,
              customUrl: true,
            });
            setPreviewData(() => ({ ...metadata, url: link.link }));
          } catch (error) {
            console.error("Error fetching webpage metadata:", error);
            setPreviewData(() => ({ url: link.link }));
          }
        }
      }

      const textBeforeCursor = currentText.substring(0, cursorPosition);
      const lastCharTyped = cursorPosition
        ? currentText.charAt(cursorPosition - 1)
        : "";

      const mentionPattern = /@(\S{1,31})$/;
      const mentionMatch = mentionPattern.exec(textBeforeCursor);

      if (mentionMatch) {
        const mentionTerm = mentionMatch[1];
        searchMentionsHandler(mentionTerm);
      } else if (mentionChars.includes(lastCharTyped)) {
        searchMentionsHandler("");
      } else {
        setMentionSuggestions({});
      }
    }
  }

  function submitHandler(event: React.FormEvent) {
    event.preventDefault();
    const updatedEditorContent = quillRef.current?.getEditor().getContents();
    if (updatedEditorContent?.ops) {
      // const firstOp = updatedEditorContent.ops[0];
      // firstOp.insert = firstOp.insert.replace(/^[\s\n]+/, "");
      const lastOp =
        updatedEditorContent.ops[updatedEditorContent.ops.length - 1];
      lastOp.insert = lastOp.insert.replace(/[\s\n]+$/g, "\n");
    }
    updatedEditorContent &&
      quillRef.current?.getEditor().setContents(updatedEditorContent);
    setEditorContent(() => updatedEditorContent);

    onSubmit(event, editorContent, previewData, () => {
      editorChangeHandler(
        setEditorHtml.bind(null, () => {
          setTimeout(() => quillRef.current?.editor?.blur(), 100);
          return "";
        })
      );
      setPreviewData(() => null);
    });
  }

  const modules = {
    toolbar: [
      ["bold", "italic", "strike"],
      ["link"],
      [{ list: "ordered" }, { list: "unordered" }],
      ["blockquote"],
      ["code", "code-block"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "bold",
    "italic",
    "strike",
    "link",
    "list",
    "blockquote",
    "code",
    "code-block",
  ];

  return (
    <form
      className="relative flex flex-col dark-theme rounded-md border text-gray-200"
      onSubmit={submitHandler}
    >
      {previewData && (
        <div className="relative max-w-max w-full mx-4 my-4">
          <Button
            className="absolute right-4 top-3"
            onClick={() => setPreviewData(() => null)}
          >
            <i className="fa-solid fa-xmark"></i>
          </Button>
          <a
            href={previewData.url}
            className="flex gap-4 shadow-md max-w-2xl p-4 dark-theme-2 rounded-md"
            rel="noreferrer"
            target="_blank"
          >
            <div className="w-3/6 mx-4 my-6">
              {previewData.image ? (
                <img
                  src={previewData.image}
                  alt={previewData.title}
                  className="object-cover max-h-full max-w-2/6 rounded-md"
                />
              ) : (
                <iframe
                  src={previewData.url}
                  title={previewData.title}
                  className="object-cover max-h-full max-w-2/6 rounded-md"
                />
              )}
            </div>
            <div className="m-4 w-4/6">
              {previewData.title && (
                <h3 className="text-xl font-bold mb-2">{previewData.title}</h3>
              )}
              {previewData.description && (
                <p className="text-gray-400 mb-4">{previewData.description}</p>
              )}
            </div>
          </a>
        </div>
      )}
      <div ref={emojiPickerRef} className="w-full">
        {mentionSuggestions &&
          Object.keys(mentionSuggestions).map((chatId) => (
            <Contact
              key={chatId}
              isGroupChat={mentionSuggestions[chatId].isGroupChat}
              chatId={chatId}
              online={mentionSuggestions[chatId].isOnline}
              name={mentionSuggestions[chatId].name}
              profilePic={mentionSuggestions[chatId].profilePic}
              className={"text-white"}
              onClick={insertMentionHandler.bind(
                null,
                mentionSuggestions[chatId].name
              )}
            />
          ))}
        {showEmojiPicker && (
          <Picker
            set={"native"}
            icons={"solid"}
            dynamicWidth
            noCountryFlags={false}
            emojiSize={24}
            showSkinTones={false}
            data={data}
            previewPosition={"none"}
            onEmojiSelect={emojiHandler}
          />
        )}
        <ReactQuill
          ref={quillRef}
          className="chat-input dark-theme bg-gray-800 text-gray-200 rounded-md"
          theme="snow"
          placeholder="Chat comes here..."
          modules={modules}
          formats={formats}
          value={editorHtml}
          onChange={editorChangeHandler.bind(null, undefined)}
          onKeyDown={(e) => {
            if (e.keyCode === 13 && !e.shiftKey && !e.ctrlKey) {
              enterKeyHandler();
              submitHandler(e);
            }
          }}
        />
        <div className="flex gap-2 items-center">
          <Input
            type="file"
            style={{ display: "none" }}
            callback={fileChangeHandler}
            className="my-2 px-3 border-r border-gray-500"
          >
            <i className="fa-duotone fa-circle-plus"></i>
          </Input>
          <Button
            type="button"
            className="my-2 px-2"
            onClick={() => setShowEmojiPicker((prevState) => !prevState)}
          >
            <i className="fa-light fa-face-smile"></i>
          </Button>
          <Button type="button" className="my-2 pl-1" onClick={atSymbolHandler}>
            <i className="fa-light fa-at"></i>
          </Button>
          <Button
            type="submit"
            className="bg-green-500 pl-2 pr-6 text-white rounded-sm ml-auto mr-2"
          >
            <i className="fa-solid fa-paper-plane-top"></i>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
