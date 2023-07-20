import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import { DeltaStatic, RangeStatic, Sources } from "quill";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import Input from "../Input/Input";
import Button from "../Button/Button";
import Contact from "../Contact/Contact";
import { useHttpClient } from "../../hooks/useHttpClient-hook";
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

interface UserObject {
  [key: string]: { username: string; online: boolean };
}

interface ChatInputProps extends React.PropsWithChildren {
  users: UserObject | null;
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
  const { users, fileChangeHandler, onSubmit } = props;

  const [editorHtml, setEditorHtml] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<UserObject>({});
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previousContent, setPreviousContent] = useState<DeltaStatic>();
  const mentionChars = ["@"];
  const quillRef = useRef<ReactQuill>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
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
    if (users) {
      const filteredUsers: UserObject = {};

      for (const key in users) {
        if (
          users[key].username &&
          users[key].username.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          filteredUsers[key] = users[key];
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
    currentDelta: DeltaStatic,
    previousDelta?: DeltaStatic
  ) {
    if (!previousDelta) {
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
    content: string,
    delta: DeltaStatic,
    source: Sources,
    editor: ReactQuill.UnprivilegedEditor
  ) {
    setEditorHtml(content);
    if (source === "user") {
      const removedURL = findRemovedURL(delta, previousContent);
      if (removedURL) {
        setPreviewData(() => null);
      }
    }
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
      setPreviousContent(() => editor.getContents());
    }
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

  function submitHandler(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(
      event,
      quillRef.current?.getEditor().setContents(previousContent!),
      previewData,
      () => {
        setEditorHtml(() => "");
        setPreviewData(() => null);
      }
    );
  }

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
          Object.keys(mentionSuggestions).map((userId) => (
            <Contact
              key={userId}
              userId={userId}
              online={mentionSuggestions[userId].online}
              username={mentionSuggestions[userId].username}
              className={"text-white"}
              onClick={insertMentionHandler.bind(
                this,
                mentionSuggestions[userId].username
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
          onChange={editorChangeHandler}
          onKeyDown={(e) => {
            if (
              e.keyCode === 13 &&
              !e.shiftKey &&
              !e.ctrlKey &&
              submitBtnRef.current &&
              previousContent
            ) {
              quillRef.current?.getEditor().setContents(previousContent);
              submitBtnRef.current.click();
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
          <button
            type="submit"
            className="bg-green-500 pl-2 pr-6 text-white rounded-sm ml-auto mr-2"
            ref={submitBtnRef}
          >
            <i className="fa-solid fa-paper-plane-top"></i>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
