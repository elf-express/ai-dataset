"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import styles from "./excalidraw-renderer.module.css";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

// 預設的空白流程圖模板
const DEFAULT_MERMAID_CODE = `
flowchart TD
    A[開始] --> B{決策}
    B -->|是| C[處理]
    B -->|否| D[結束]
    C --> D
`;

function ExcalidrawRenderer({ mermaidCode, showToolbar = false, viewModeEnabled = true, zenModeEnabled = true }) {
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [excalidrawFiles, setExcalidrawFiles] = useState({});
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // 初始化畫布
  const initializeCanvas = async () => {
    if (!excalidrawAPI) return;
    
    // 如果沒有提供 mermaidCode 且畫布尚未初始化，使用預設模板
    if ((!mermaidCode || mermaidCode.trim() === "") && !initialized) {
      try {
        // 只在首次載入時顯示預設模板
        const { elements, files } = await parseMermaidToExcalidraw(DEFAULT_MERMAID_CODE);
        setExcalidrawElements(convertToExcalidrawElements(elements));
        excalidrawAPI.updateScene({
          elements: convertToExcalidrawElements(elements),
        });
        excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
          fitToContent: true,
        });
        setInitialized(true);
      } catch (error) {
        console.error("Failed to initialize canvas with default template:", error);
      }
      return;
    }
  };

  useEffect(() => {
    if (!excalidrawAPI) return;
    
    // 先初始化畫布
    if (!initialized) {
      initializeCanvas();
      return;
    }
    
    // 如果沒有 mermaidCode，維持現有畫布狀態
    if (!mermaidCode || mermaidCode.trim() === "") {
      return;
    }

    // 檢查是否為 mermaid 代碼
    const code = mermaidCode.trim();
    const isMermaid =
      code.startsWith("graph") ||
      code.startsWith("flowchart") ||
      code.startsWith("sequenceDiagram") ||
      code.startsWith("classDiagram") ||
      code.startsWith("stateDiagram") ||
      code.startsWith("erDiagram") ||
      code.startsWith("gantt") ||
      code.startsWith("pie");

    if (!isMermaid) {
      setRenderError(code); // 直接顯示 AI 提示
      return;
    }

    const renderMermaid = async () => {
      setIsRendering(true);
      setRenderError(null);

      try {
        const { elements, files } = await parseMermaidToExcalidraw(code);

        setExcalidrawElements(convertToExcalidrawElements(elements));
        excalidrawAPI.updateScene({
          elements: convertToExcalidrawElements(elements),
        });
        excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
          fitToContent: true,
        });
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        
        // 提供更詳細的錯誤信息，特別是關於支持的圖表類型
        const errorMessage = error.toString();
        let userFriendlyMessage = "圖表渲染失敗。";
        let isUnsupportedType = false;
        
        // 檢查是否為語法錯誤
        if (errorMessage.includes("Parse error")) {
          userFriendlyMessage = "Mermaid語法錯誤。請確保圖表語法正確。";
        }
        
        // 檢查是否為不支持的圖表類型
        if (code.includes("gantt") || code.includes("pie") || 
            code.includes("stateDiagram") || code.includes("classDiagram") ||
            code.includes("erDiagram")) {
          isUnsupportedType = true;
          userFriendlyMessage = "已生成圖表代碼，但目前僅支持渲染流程圖(flowchart)和時序圖(sequenceDiagram)。";
        }
        
        setRenderError(userFriendlyMessage);
        
        // 如果是不支持的圖表類型，使用信息提示而非錯誤提示
        if (isUnsupportedType) {
          toast.info(userFriendlyMessage);
        } else {
          toast.error("圖表渲染失敗：" + userFriendlyMessage);
        }
      } finally {
        setIsRendering(false);
      }
    };

    renderMermaid();
  }, [excalidrawAPI, mermaidCode, initialized]);


  return (
    <div className={styles["excalidraw-wrapper"] + " relative h-full w-full"}>
      <div 
        className="border rounded-md h-full relative bg-card"
        style={{ touchAction: "none" }}
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md p-6 shadow-md flex flex-col items-center max-w-lg mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <div className="font-bold mb-2">AI 提示</div>
              <div className="text-center whitespace-pre-line">{renderError}</div>
            </div>
          </div>
        )}
        
        <Excalidraw
          initialData={{
            appState: {
              viewBackgroundColor: "#fafafa",
              currentItemFontFamily: 1,
              zenModeEnabled: zenModeEnabled,
              viewModeEnabled: viewModeEnabled,
              showStats: false,
              showHelpDialog: false,
              pendingImageElementId: null,
              gridSize: null,
              hideInterface: true,
            },
            scrollToContent: true,
          }}
          height="100%"
          width="100%"
          theme="light"
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          langCode="zh-TW"
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsScene: false,
              saveToActiveFile: false,
              loadScene: false,
              clearCanvas: false,
            },
            tools: false,
            menu: false,
            personalSpace: false,
            dockedSidebarBreakpoint: null,
            elements: false,
            welcomeScreen: false,
            defaultSidebarDockedPreference: false,
          }}
          autoFocus={false}
        />
      </div>
    </div>
  );
}

export default ExcalidrawRenderer; 
