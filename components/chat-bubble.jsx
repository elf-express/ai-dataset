import React, { useRef } from "react";

export function ChatBubble({ msg }) {
  // 偵測是否有 mermaid code
  const mermaidMatch = msg.role === "assistant" && msg.content.match(/```mermaid([\s\S]*?)```/);
  const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : null;
  // 將純文字部分與 mermaid code 分開顯示
  const textContent = mermaidCode
    ? msg.content.replace(/```mermaid([\s\S]*?)```/, "").trim()
    : msg.content;
  
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
          <pre className="relative bg-white border border-gray-300 rounded-md p-2 pr-10 mt-2 overflow-x-auto text-[13px] leading-relaxed">
            <code className="block pr-2">{`mermaid\n${mermaidCode}`}</code>
            
            {msg.role === "assistant" && (
              <button 
                ref={copyBtnRef}
                aria-label="複製代碼"
                className="absolute top-2 right-2 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-10 shadow-sm"
                onClick={() => {
                  const fullCode = `mermaid\n${mermaidCode}`;
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
        )}
      </div>
    </div>
  );
}
