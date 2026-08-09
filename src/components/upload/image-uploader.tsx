"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, FileImage, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageSelected: (base64String: string) => void;
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const compressAndReadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If PDF, read directly
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDimension = 2200;
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 15MB.");
      return;
    }

    setFileInfo({ name: file.name, size: file.size, type: file.type });

    try {
      const base64String = await compressAndReadImage(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(base64String);
      } else {
        setPreviewUrl(null);
      }
      onImageSelected(base64String);
    } catch (err) {
      console.error("Error reading file:", err);
      toast.error("Failed to read image file.");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (fileInfo) {
    return (
      <div className="w-full border rounded-xl overflow-hidden bg-muted/30">
        {previewUrl ? (
          <div className="relative aspect-video w-full max-h-[400px] flex items-center justify-center bg-black/5">
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full shadow-md"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{fileInfo.name}</p>
                <p className="text-sm text-slate-500">{formatFileSize(fileInfo.size)}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        )}
        {previewUrl && (
          <div className="flex items-center justify-between p-4 bg-white border-t">
            <div className="flex items-center gap-3">
              <FileImage className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm text-slate-800 line-clamp-1">{fileInfo.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(fileInfo.size)}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              handleRemove();
              fileInputRef.current?.click();
            }}>
              Change File
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer group flex flex-col items-center justify-center p-12 text-center",
        isDragging
          ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
          : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
      />
      <div className="w-16 h-16 mb-4 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
        <UploadCloud className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Drag & drop or click to upload</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6">
        Upload a high-quality photo or scan of the medical prescription. 
        Supported formats: JPG, PNG, WEBP, PDF (Max 15MB).
      </p>
      <Button type="button" className="pointer-events-none">
        Select File
      </Button>
    </div>
  );
}
