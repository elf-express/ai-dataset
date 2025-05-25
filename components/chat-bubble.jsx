import React from "react";

export function ChatBubble({ msg }) {
  // 偵測是否有 mermaid code
  const mermaidMatch = msg.role === "assistant" && msg.content.match(/```mermaid([\s\S]*?)```/);
  const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : null;
  // 將純文字部分與 mermaid code 分開顯示
  const textContent = mermaidCode
    ? msg.content.replace(/```mermaid([\s\S]*?)```/, "").trim()
    : msg.content;

  return (
    <div
      className={
        msg.role === "user"
          ? "flex justify-end"
          : "flex justify-start"
      }
    >
      <div
        className={`chat-bubble px-4 py-2 rounded-2xl shadow-sm max-w-[80%] break-words whitespace-pre-line mb-1 ${
          msg.role === "user"
            ? "bg-blue-500 text-white self-end"
            : "bg-gray-200 text-gray-800 self-start"
        }`}
      >
        {textContent}
        {mermaidCode && (
          <pre className="bg-white border border-gray-300 rounded-md p-2 mt-2 overflow-x-auto text-xs">
            <code>{`mermaid\n${mermaidCode}`}</code>
            <div className="mt-1 text-right">
              <button
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                onClick={() => navigator.clipboard.writeText(mermaidCode)}
              >
                複製語法
              </button>
            </div>
          </pre>
        )}
      </div>
    </div>
  );
}
