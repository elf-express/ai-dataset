import React, { useRef } from "react";

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
            ? "bg-primary text-primary-foreground self-end text-sm"
            : "bg-gray-200 text-gray-800 self-start text-sm"
        }`}
      >
        {textContent}
        {mermaidCode && (
          <div className="mermaid-code-container mt-2 rounded-md border border-gray-300 overflow-hidden">
            <pre className={`relative p-2 pr-10 overflow-x-auto text-[13px] leading-relaxed ${
              msg.role === "user" 
                ? "bg-blue-50" 
                : "bg-white"
            }`}>
              <code className="block pr-2">{mermaidCode}</code>
              
              {msg.role === "assistant" && (
                <button 
                  ref={copyBtnRef}
                  aria-label="複製代碼"
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-10 shadow-sm"
                  onClick={() => {
                    const fullCode = mermaidCode;
                    navigator.clipboard.writeText(fullCode)
                      .then(() => {
                        // 顯示複製成功的視覺反饰
                        if (copyBtnRef.current) {
                          // 切換按鈕樣式為成功狀態
                          copyBtnRef.current.classList.add('bg-green-600');
                          copyBtnRef.current.classList.remove('bg-primary');
                          
                          // 更新按鈕內容
                          const originalContent = copyBtnRef.current.innerHTML;
                          copyBtnRef.current.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                          
                          setTimeout(() => {
                            if (copyBtnRef.current) {
                              copyBtnRef.current.innerHTML = originalContent;
                              copyBtnRef.current.classList.remove('bg-green-600');
                              copyBtnRef.current.classList.add('bg-primary');
                            }
                          }, 2000);
                        }
                      })
                      .catch(err => {
                        console.error('無法複製到剪貼簿:', err);
                      });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
