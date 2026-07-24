"use client";

import React, { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import { parseEPFPassbook } from "@/lib/epf-parser";
import { EPFData } from "@/lib/types";

interface FileUploadProps {
  onDataParsed: (data: EPFData) => void;
  compact?: boolean;
}

export function FileUpload({ onDataParsed, compact = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }
    setLoading(true);
    try {
      const parsedData = await parseEPFPassbook(file);
      onDataParsed(parsedData);
    } catch (error) {
      console.error("Error parsing PDF:", error);
      alert("Failed to parse PDF. Are you sure this is an EPFO passbook?");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const file of Array.from(e.dataTransfer.files)) {
        await processFile(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (const file of Array.from(e.target.files)) {
        await processFile(file);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl text-center transition-all ${
        isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-blue-400 bg-white"
      } ${compact ? "p-4" : "p-12"}`}
    >
      {!compact && (
        <>
          <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Drag & Drop your EPF Passbook PDF</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            All processing happens directly in your browser. 100% private.
          </p>
        </>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        multiple
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center w-full ${
          compact ? "py-1.5 px-3 text-sm" : "py-2 px-6"
        }`}
      >
        <UploadCloud className={`mr-2 ${compact ? "w-4 h-4" : "hidden"}`} />
        {loading ? "Parsing..." : "Select File"}
      </button>
    </div>
  );
}
