import React, { useEffect, useRef } from "react";
import ReactQuill from "react-quill";

import "./MessageBox.css";

interface MessageBoxProps extends React.PropsWithChildren {
  value?: any;
  previewData?: any;
}

const modules = {
  toolbar: [
    ["bold", "italic", "strike"],
    ["link"],
    [{ list: "ordered" }, { list: "unordered" }],
    ["blockquote"],
    ["code", "code-block"],
  ],
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

const MessageBox: React.FC<MessageBoxProps> = (props) => {
  const { value, previewData } = props;

  const messageBoxRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.getEditor().setContents(value);
    }
  }, [value]);

  return (
    <>
      {previewData && previewData.url && (
        <div className="relative max-w-max w-full px-1 mt-2 shadow-inner rounded-md">
          <a
            href={previewData.url}
            className="max-w-2xl rounded-md"
            rel="noreferrer"
            target="_blank"
          >
            <div className="max-w-full">
              {previewData.image && (
                <img
                  src={previewData.image}
                  alt={previewData.title}
                  className="object-cover max-h-full max-w-full rounded-md"
                />
              )}
            </div>
            <div className="max-w-full m-2">
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
      <ReactQuill
        ref={messageBoxRef}
        className="message-box"
        modules={modules}
        formats={formats}
        readOnly
      />
    </>
  );
};

export default MessageBox;
