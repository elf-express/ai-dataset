"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);
  // 固定 initialData 物件，避免每次渲染都產生新物件導致 Excalidraw 重設
const excalidrawInitialData = {
  appState: {
    viewBackgroundColor: "#fafafa",
    currentItemFontFamily: 1,
    zenModeEnabled: false,
    viewModeEnabled: false,
  },
};

function ExcalidrawRenderer({ mermaidCode }) {
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [excalidrawFiles, setExcalidrawFiles] = useState({});
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // 只要 mermaidCode 有變動（包含手動編輯），畫布就會自動同步更新
  useEffect(() => {
    if(!excalidrawAPI) return;
    
    if (!mermaidCode || mermaidCode.trim() === "") {
      setExcalidrawElements([]);
      setExcalidrawFiles({});
      setRenderError(null);
      excalidrawAPI.resetScene();
      return;
    }
    

    // 清理 Mermaid 代碼的輔助函數
    const cleanMermaidCode = (code) => {
      if (!code) return '';
      
      // 1. 修復轉義的引號和方括號
      let cleaned = code.replace(/\\"/g, '"').replace(/\\\[/g, '[').replace(/\\\]/g, ']');
      
      // 2. 移除可能的代碼塊標記
      cleaned = cleaned.replace(/^```(mermaid)?\s*\n|\s*```$/g, '');
      
      // 3. 確保 direction 聲明是子圖內的第一個語句
      cleaned = cleaned.replace(/(subgraph\s+[^\n{]*\s*{)([^\n]*)(\s*direction\s+[LR|TB|RL|BT]+)/g, 
        (match, p1, p2, p3) => {
          // 如果 direction 不是子圖的第一個語句，則將其移動到最前面
          const content = p2.replace(/^\s*\n?|\s*$/g, '');
          return `${p1}\n    ${p3}${content ? '\n    ' + content : ''}`;
        }
      );
      
      // 4. 確保每個節點定義後都有換行
      cleaned = cleaned.replace(/([;}\]])/g, '$1\n');
      
      // 5. 確保節點之間有適當的空格
      cleaned = cleaned.replace(/(\w\s*\[.*?\])(?=\w)/g, '$1\n');
      
      // 6. 修復節點 ID 中的點號
      cleaned = cleaned.replace(/(\w+)\.(\d+)/g, '$1_$2');
      
      // 7. 移除多餘的空行
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      cleaned = cleaned.trim();

      // 新增：去除首尾多餘的引號
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }

      return cleaned;
    };

    const renderMermaid = async () => {
      setIsRendering(true);
      setRenderError(null);

      try {
        // 先做完整清理
        let cleanedMermaidCode = cleanMermaidCode(mermaidCode);

        // 再將 [] 內含有中文或空格的標籤自動加上雙引號
        cleanedMermaidCode = cleanedMermaidCode.replace(
          /(\[[^\]"']*[\u4e00-\u9fa5\s][^\]"']*\])/g,
          (match) => {
            if (/^\[".*"\]$/.test(match)) return match;
            return '["' + match.slice(1, -1) + '"]';
          }
        );

        console.log('Cleaned Mermaid code:', cleanedMermaidCode);
        
        const { elements, files } = await parseMermaidToExcalidraw(
          cleanedMermaidCode,
        );

        setExcalidrawElements(convertToExcalidrawElements(elements));
        excalidrawAPI.updateScene({
          elements: convertToExcalidrawElements(elements),
        });
        excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
          fitToContent: true,
        });
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        setRenderError("無法渲染 Mermaid 代碼。請檢查語法是否正確。");
        toast.error("圖表渲染失敗，請檢查 Mermaid 代碼語法");
      } finally {
        setIsRendering(false);
      }
    };

    renderMermaid();
  }, [mermaidCode]);


  return (
    <div className="space-y-2 h-full min-h-[600px]">
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
            <div className="text-destructive text-center p-4">
              {renderError}
            </div>
          </div>
        )}
        
        { (
          <Excalidraw
            initialData={excalidrawInitialData}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            langCode="zh-TW"
          />
        )}
      </div>
    </div>
  );
}

export default ExcalidrawRenderer;