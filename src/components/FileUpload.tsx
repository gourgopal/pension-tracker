"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Lock } from "lucide-react";
import { parsePassbook } from "@/lib/parser-entry";
import { PensionAccount } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onDataParsed: (data: any) => void;
  compact?: boolean;
}

export function FileUpload({ onDataParsed, compact = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<{ isOpen: boolean; file: File | null; passwordValue: string; error: string }>({
    isOpen: false,
    file: null,
    passwordValue: '',
    error: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File, password?: string) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }
    
    setLoading(true);
    try {
      const parsedData = await parsePassbook(file, password);
      onDataParsed(parsedData);
      
      // Close password modal if it was open and successful
      if (passwordPrompt.isOpen) {
        setPasswordPrompt({ isOpen: false, file: null, passwordValue: '', error: '' });
      }
    } catch (error: any) {
      console.error("Error parsing PDF:", error);
      
      if (error.name === "PasswordException" || (error.message && error.message.includes("Password"))) {
        // Show password prompt
        setPasswordPrompt({
          isOpen: true,
          file,
          passwordValue: '',
          error: password ? 'Incorrect password. Please try again.' : ''
        });
      } else {
        alert("Failed to parse PDF. Ensure it is a valid EPF or NPS passbook.");
        if (passwordPrompt.isOpen) {
           setPasswordPrompt({ ...passwordPrompt, error: 'Failed to parse file with this password.' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordPrompt.file || !passwordPrompt.passwordValue) return;
    
    await processFile(passwordPrompt.file, passwordPrompt.passwordValue);
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
          <h3 className="text-lg font-semibold text-slate-700">Drag & Drop your EPF/NPS Passbook PDF</h3>
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

      <Dialog open={passwordPrompt.isOpen} onOpenChange={(isOpen) => {
        if (!isOpen) setPasswordPrompt({ isOpen: false, file: null, passwordValue: '', error: '' });
      }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handlePasswordSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                Password Required
              </DialogTitle>
              <DialogDescription>
                This PDF is encrypted. <br/><br/>
                <strong>For NPS CAS statements</strong>, the password is usually the first 4 letters of your name (lowercase) followed by your date of birth (DDMM). e.g., <code>gour0512</code>.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Input
                id="password"
                type="password"
                placeholder="Enter document password"
                value={passwordPrompt.passwordValue}
                onChange={(e) => setPasswordPrompt({...passwordPrompt, passwordValue: e.target.value})}
                autoFocus
                className={passwordPrompt.error ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {passwordPrompt.error && (
                <p className="text-red-500 text-sm mt-2">{passwordPrompt.error}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordPrompt({ isOpen: false, file: null, passwordValue: '', error: '' })}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !passwordPrompt.passwordValue}>
                {loading ? "Decrypting..." : "Decrypt & Parse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
