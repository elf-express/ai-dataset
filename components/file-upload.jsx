"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, FileText, File } from "lucide-react";
import { extractTextFromFile } from "@/lib/file-service";
import { formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FileUpload({ onTextExtracted }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0]; // Only process the first file
      
      // Check file type
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!['txt', 'md', 'docx'].includes(fileExt)) {
        toast.error("不支持的文件類型。請上傳 .txt, .md 或 .docx 文件。");
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("文件太大。請上傳小於 10MB 的文件。");
        return;
      }

      setIsProcessing(true);
      
      try {
        const { text, error } = await extractTextFromFile(file);
        
        if (error) {
          toast.error(error);
          return;
        }
        
        if (!text || text.trim() === "") {
          toast.error("無法從文件中提取文本內容。");
          return;
        }
        
        toast.success(`已成功從 ${file.name} 提取文本`);
        onTextExtracted(text);
      } catch (error) {
        console.error("File processing error:", error);
        toast.error("處理文件時出錯：" + error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [onTextExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
        ${isDragActive ? "border-primary bg-primary/5" : "border-border"}
        ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p>正在處理文件...</p>
          </>
        ) : (
          <>
            <div className="p-3 bg-primary/10 rounded-full">
              {isDragActive ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              {isDragActive ? (
                <p className="font-medium">放下文件以上傳</p>
              ) : (
                <>
                  <p className="font-medium">點擊或拖放文件到此處上傳</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    支持 .txt, .md, .docx 格式（最大 10MB）
                  </p>
                </>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2">
              <File className="mr-2 h-4 w-4" />
              選擇文件
            </Button>
          </>
        )}
      </div>
    </div>
  );
} 