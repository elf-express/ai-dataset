import React, { useRef, useState } from "react";

export function ChatBubble({ msg }) {
  // 檢查是否有 mermaid code
  // 先檢查是否是 ```mermaid 格式
  const mermaidBlockMatch = msg.role === "assistant" && msg.content.match(/```mermaid([\s\S]*?)```/);
  
  // 檢查是否是直接的 Mermaid 代碼（如以 flowchart TD 開頭）
  const isDirectMermaidCode = (content) => {
    if (!content || typeof content !== 'string') return false;
    
    const trimmedContent = content.trim();
    const mermaidTypes = [
      "graph", "flowchart", "sequenceDiagram", "classDiagram", 
      "stateDiagram", "erDiagram", "gantt", "pie", "journey"
    ];
    
    return mermaidTypes.some(type => 
      trimmedContent.startsWith(type) || 
      trimmedContent.match(new RegExp(`^(flowchart|graph)\\s+[TBRLUD]+`))
    );
  };
  
  // 確定是否為 Mermaid 代碼以及其內容
  let mermaidCode = null;
  let textContent = msg.content;

  if (mermaidBlockMatch) {
    // 如果是 ```mermaid 格式
    mermaidCode = mermaidBlockMatch[1].trim();
    textContent = msg.content.replace(/```mermaid([\s\S]*?)```/, "").trim();
  } else if (msg.role === "assistant" && isDirectMermaidCode(msg.content)) {
    // 如果是直接的 Mermaid 代碼
    mermaidCode = msg.content.trim();
    textContent = "";
  } else if (msg.role === "user" && isDirectMermaidCode(msg.content)) {
    // 如果是用戶輸入的直接 Mermaid 代碼
    mermaidCode = msg.content.trim();
    textContent = "";
  }

  // 建立複製按鈕的引用
  const copyBtnRef = useRef(null);

  // 將 mermaidCode 變成 state
  const [mermaidCodeState, setMermaidCodeState] = useState(mermaidCode);
  // 編輯模式狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(mermaidCode);

  return (
    <div
      className={
        msg.role === "user"
          ? "flex justify-end"
          : "flex justify-start"
      }
    >
      <div
        className={`chat-bubble px-4 py-2 rounded-2xl shadow-sm ${
          msg.role === "user"
            ? "inline-block max-w-full bg-primary text-primary-foreground self-end text-[14px]"
            : "w-[85%] bg-gray-200 text-gray-800 self-start text-[14px]"
        } break-words whitespace-pre-line mb-1`}
      >
        {textContent}
        {mermaidCodeState && (
          <div className="mermaid-code-container mt-2 rounded-md border border-gray-300 overflow-hidden">
            <pre className={`relative p-2 pr-10 overflow-x-auto text-[14px] leading-relaxed ${
              msg.role === "user" 
                ? "bg-blue-50" 
                : "bg-white"
            }`}>
              <code className="block pr-2">
                {isEditing ? (
                  <textarea
                    className="min-w-[300px] w-[90%] h-full min-h-[400px] border rounded p-1 text-sm font-mono"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                  />
                ) : (
                  mermaidCodeState
                )}
              </code>
              {msg.role === "assistant" && (
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button 
                    ref={copyBtnRef}
                    aria-label="複製代碼"
                    className="p-1.5 rounded-md bg-white text-black border border-gray-300 hover:bg-gray-200 transition-colors shadow-sm"
                    onClick={() => {
                      const fullCode = isEditing ? editValue : mermaidCodeState;
                      navigator.clipboard.writeText(fullCode)
                        .then(() => {
                          if (copyBtnRef.current) {
                            copyBtnRef.current.classList.add('bg-green-600', 'text-white');
                            copyBtnRef.current.classList.remove('bg-white', 'text-black');
                            const originalContent = copyBtnRef.current.innerHTML;
                            copyBtnRef.current.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                            setTimeout(() => {
                              if (copyBtnRef.current) {
                                copyBtnRef.current.innerHTML = originalContent;
                                copyBtnRef.current.classList.remove('bg-green-600', 'text-white');
                                copyBtnRef.current.classList.add('bg-white', 'text-black');
                              }
                            }, 2000);
                          }
                        })
                        .catch(err => {
                          console.error('無法複製到剪貼簿:', err);
                        });
                    }}
                  >
                    {/* 黑白 icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                  <button
                    aria-label={isEditing ? "儲存" : "編輯"}
                    className={`p-1.5 rounded-md border border-gray-300 transition-colors shadow-sm ${
                      isEditing
                        ? "bg-green-600 text-white"
                        : "bg-white text-black hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        setMermaidCodeState(editValue);
                        setIsEditing(false);
                      } else {
                        setEditValue(mermaidCodeState);
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? (
                      // 儲存 icon
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      // 編輯 icon
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7v-2l8-8a2 2 0 112.828 2.828l-8 8z"/></svg>
                    )}
                  </button>
                </div>
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
