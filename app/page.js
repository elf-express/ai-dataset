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
      toast.error(`文本超過${maxChars}字符限制`);
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

    try {
      const { mermaidCode: generatedCode, error } = await generateMermaidFromText(
        inputText,
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

      // 只有在API調用成功後才增加使用量
      if (!hasUnlimited) {
        incrementUsage();
        setRemainingUsage(getRemainingUsage());
      }

      // 預處理生成的mermaidCode
      const processedCode = preprocessMermaidCode(generatedCode);
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

      <main className="w-full py-6 px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        <section className="space-y-4 col-span-12 md:col-span-4">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">手動輸入</TabsTrigger>
              <TabsTrigger value="file">文件上傳</TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <TextInput
                value={inputText}
                onChange={handleTextChange}
                maxLength={maxChars}
                disabled={isGenerating || locked || !passwordVerified}
              />
            </TabsContent>
            <TabsContent value="file">
              <FileUpload onTextExtracted={handleFileTextExtracted} />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between">
            <DiagramTypeSelector value={diagramType} onChange={handleDiagramTypeChange} />
            <Button
              onClick={handleGenerateClick}
              disabled={isGenerating || locked || !passwordVerified}
              className="ml-2"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              生成圖表
            </Button>
          </div>

          <MermaidEditor
            code={mermaidCode}
            onChange={handleMermaidCodeChange}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            disabled={locked || !passwordVerified}
          />
        </section>
        <section className="h-full min-h-[600px] col-span-12 md:col-span-8">
          <ExcalidrawRenderer mermaidCode={mermaidCode} />
        </section>
      </main>
      
      <footer className="border-t py-4 px-6">
        <div className=" text-center text-sm text-muted-foreground">
          AI 生成 圖表 &copy; {new Date().getFullYear()}
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
