"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Header } from "@/components/header";
import { SettingsDialog } from "@/components/settings-dialog";
import { TextInput } from "@/components/text-input";
import { FileUpload } from "@/components/file-upload";
import { DiagramTypeSelector } from "@/components/diagram-type-selector";
import { MermaidEditor } from "@/components/mermaid-editor";
import { ChatHistory } from "@/components/chat-history";
// import { ExcalidrawRenderer } from "@/components/excalidraw-renderer";
import { generateMermaidFromText } from "@/lib/ai-service";
import { isWithinCharLimit } from "@/lib/utils";
import { isPasswordVerified, hasCustomAIConfig, hasUnlimitedAccess } from "@/lib/config-service";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const ExcalidrawRenderer = dynamic(() => import("@/components/excalidraw-renderer"), { ssr: false });

const usageLimit = parseInt(process.env.NEXT_PUBLIC_DAILY_USAGE_LIMIT || "5");

// Usage tracking functions
const checkUsageLimit = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  const todayUsage = usageData[today] || 0;
  return todayUsage < usageLimit; // Return true if within limit
};

const incrementUsage = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = 0;
  }
  
  usageData[today] += 1;
  localStorage.setItem('usageData', JSON.stringify(usageData));
};

const checkAndIncrementUsage = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = 0;
  }
  
  if (usageData[today] >= usageLimit) {
    return false; // Limit exceeded
  }
  
  usageData[today] += 1;
  localStorage.setItem('usageData', JSON.stringify(usageData));
  return true; // Within limit
};

const getRemainingUsage = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  const todayUsage = usageData[today] || 0;
  return Math.max(0, usageLimit - todayUsage);
};

// Preprocessing function for mermaidCode
const preprocessMermaidCode = (code) => {
  if (!code) return code;
  // Remove <br> tags
  return code.replace(/<br\s*\/?>/gi, '');
};

export default function Home() {
  // 密碼驗證與鎖定狀態
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // 進站時檢查密碼狀態與錯誤次數
  useEffect(() => {
    const verified = isPasswordVerified();
    setPasswordVerified(verified);

    const attempts = parseInt(localStorage.getItem('passwordAttempts') || '0', 10);
    setPasswordAttempts(attempts);
    if (attempts >= 5) setLocked(true);
  }, []);

  // 密碼驗證回調
  const handlePasswordVerified = (verified) => {
    setPasswordVerified(verified);
    if (verified) {
      setPasswordAttempts(0);
      localStorage.setItem('passwordAttempts', '0');
    }
  };
  // 密碼錯誤時計數
  const handlePasswordFailed = () => {
    let attempts = parseInt(localStorage.getItem('passwordAttempts') || '0', 10) + 1;
    setPasswordAttempts(attempts);
    localStorage.setItem('passwordAttempts', attempts);
    if (attempts >= 5) setLocked(true);
  };

  const [messages, setMessages] = useState([
    { role: "system", content: "你是一個 mermaid 流程圖專家，根據用戶描述，幫助生成正確且簡潔的 mermaid 語法。" }
  ]);
  const [inputText, setInputText] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [diagramType, setDiagramType] = useState("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState(5);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [hasCustomConfig, setHasCustomConfig] = useState(false);
  const maxChars = parseInt(process.env.NEXT_PUBLIC_MAX_CHARS || "200000");

  useEffect(() => {
    // Update remaining usage count on component mount
    setRemainingUsage(getRemainingUsage());
    // Check password verification status
    setPasswordVerified(isPasswordVerified());
    // Check custom AI config status
    setHasCustomConfig(hasCustomAIConfig());
  }, []);

  const handleTextChange = (text) => {
    setInputText(text);
  };

  const handleFileTextExtracted = (text) => {
    setInputText(text);
  };

  const handleDiagramTypeChange = (type) => {
    setDiagramType(type);
  };

  const handleMermaidCodeChange = (code) => {
    setMermaidCode(code);
  };

  const handleStreamChunk = (chunk) => {
    setStreamingContent(prev => prev + chunk);
  };

  // 將 messages 轉為對話歷史顯示（不含 system）
  const getChatHistory = () => {
    return messages
      .filter(m => m.role !== "system")
      .map((m, idx) => (m.role === "user" ? `🧑‍💻 ${m.content}` : `🤖 ${m.content}`))
      .join("\n\n");
  };

  const handleSettingsClick = () => {
    setShowSettingsDialog(true);
  };

  const handleContactClick = () => {
    setShowContactDialog(true);
  };

  const handleConfigUpdated = () => {
    // 重新檢查自定義配置狀態
    setHasCustomConfig(hasCustomAIConfig());
  };

  const handleGenerateClick = async () => {
    if (!inputText.trim()) {
      toast.error("請輸入文本內容");
      return;
    }

    if (!isWithinCharLimit(inputText, maxChars)) {
      toast.error(`文本超過${maxChars}字數限制`);
      return;
    }

    // 檢查是否有無限量權限（密碼驗證通過或有自定義AI配置）
    const hasUnlimited = hasUnlimitedAccess();
    
    // 如果沒有無限量權限，則檢查使用限制（但不增加使用量）
    if (!hasUnlimited) {
      if (!checkUsageLimit()) {
        setShowLimitDialog(true);
        return;
      }
    }

    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingContent("");

    // 多輪對話：組裝正確 messages 陣列
    let newMessages = [...messages];
    // 清除舊的 mermaidCode 記錄，避免混淆
    setMermaidCode("");
    // 2. 新增本次 user 輸入（只放用戶自然語言）
    newMessages = [...newMessages, { role: "user", content: inputText }];
    setMessages(newMessages);
    // 3. 清空輸入框
    setInputText("");

    try {
      // 呼叫 AI，傳完整 messages
      const { mermaidCode: generatedCode, error, aiReply } = await generateMermaidFromText(
        newMessages,
        diagramType,
        handleStreamChunk
      );

      if (error) {
        toast.error(error);
        return;
      }

      if (!generatedCode) {
        toast.error("生成圖表失敗，請重試");
        return;
      }

      // AI 生成內容（AI生成區塊）作為 assistant message
      // 確保即使 aiReply 為空，也會將生成的 mermaid 代碼添加到對話歷史中
      if (aiReply) {
        setMessages(msgs => [...msgs, { role: "assistant", content: aiReply }]);
      } else if (generatedCode) {
        // 如果沒有 aiReply 但有生成 mermaid 代碼，則創建一個更精簡的回覆格式
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const formattedReply = "我已根據您的請求生成了流程圖：```mermaid\n" + generatedCode + "\n```\n如果需要修改，請告訴我。 [" + timeString + "]";
        setMessages(msgs => [...msgs, { role: "assistant", content: formattedReply }]);
      }

      // 只有在API調用成功後才增加使用量
      if (!hasUnlimited) {
        incrementUsage();
        setRemainingUsage(getRemainingUsage());
      }

      // Mermaid 語法區塊
      const safeMermaidCode = typeof generatedCode === "string" ? generatedCode : "";
      const processedCode = preprocessMermaidCode(safeMermaidCode);
      setMermaidCode(processedCode);
      toast.success("圖表生成成功");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("生成圖表時發生錯誤");
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  return (
    <>
      <Header
        remainingUsage={remainingUsage}
        usageLimit={usageLimit}
        onSettingsClick={handleSettingsClick}
        onContactClick={handleContactClick}
        isPasswordVerified={passwordVerified}
        hasCustomConfig={hasCustomConfig}
      />

      {/* 主內容區塊，Header 高度不變，下方 30px footer，剩餘空間自動分配 */}
      {/* 主內容區塊，左右有統一內間距，兩側皆為大卡片布局 */}
      <main className="flex flex-col md:flex-row gap-y-0 md:gap-x-[20px] px-[25px] py-[20px] h-[calc(100vh-110px)]">
        {/* 左側：對話區卡片 */}
        <section className="w-full md:w-[40%] flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full p-3">
            {/* 對話紀錄區 */}
            <div className="flex-1 overflow-y-auto mb-2">
              <ChatHistory messages={messages} />
            </div>
            {/* 輸入區 */}
            <div className="relative w-full mt-1">
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                maxLength={maxChars}
                disabled={isGenerating || locked || !passwordVerified}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateClick();
                  }
                }}
                className="w-full min-h-[40px] h-auto py-2 pl-4 pr-[60px] rounded-2xl border border-gray-300 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="請在此輸入或貼上文字內容 ..."
                rows={2}
                style={{lineHeight: '1.5'}}
              />
              <Button
                onClick={handleGenerateClick}
                disabled={isGenerating || locked || !passwordVerified}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg text-xs"
                size="sm"
              >
                <Wand2 className="h-3 w-3 mr-[2px]" />
                送出
              </Button>
            </div>
          </div>
        </section>
        {/* 右側：畫布卡片 */}
        <section className="w-full md:w-[60%] flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full p-3">
            <ExcalidrawRenderer 
              mermaidCode={mermaidCode || ''} 
              showToolbar={false}
            />
          </div>
        </section>
      </main>
      {/* 底部 footer，高度固定 30px */}
      <footer className="border-t px-6" style={{ height: 30, minHeight: 30 }}>
        <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground leading-none">
          AI 生成 圖表 2025
        </div>
      </footer>

    {/* Settings Dialog */}
    <SettingsDialog 
      open={showSettingsDialog} 
      onOpenChange={setShowSettingsDialog}
      onPasswordVerified={handlePasswordVerified}
      onConfigUpdated={handleConfigUpdated}
    />

      {/* 密碼驗證 Dialog，未通過或鎖定時強制顯示 */}
      {(!passwordVerified || locked) && (
        <Dialog open>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>訪問密碼驗證</DialogTitle>
              <DialogDescription>
                {locked
                  ? "密碼錯誤次數過多，已被鎖定，請稍後再試。"
                  : "請先輸入訪問密碼以使用本系統。"}
              </DialogDescription>
            </DialogHeader>
            {!locked ? (
              <SettingsDialog
                open={true}
                onOpenChange={() => {}}
                onPasswordVerified={handlePasswordVerified}
                onConfigUpdated={handleConfigUpdated}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
