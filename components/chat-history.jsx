import React, { useEffect, useRef } from "react";
import { ChatBubble } from "./chat-bubble";

export function ChatHistory({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 過濾掉系統提示訊息，只顯示用戶和助手的訊息
  const visibleMessages = messages.filter(msg => msg.role === "user" || msg.role === "assistant");

  return (
    <div className="chat-history space-y-2 p-2 bg-muted rounded-md h-full w-full overflow-y-auto">
      {visibleMessages.length === 0 && (
        <div className="text-muted-foreground text-sm text-center">尚無對話紀錄</div>
      )}
      {visibleMessages.map((msg, i) => (
        <ChatBubble key={i} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
