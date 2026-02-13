"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/gradient-button";
import { toast } from "sonner";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json", ".txt"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type FileInfo = {
  name: string;
  size: number;
  type: string;
  content: string;
  fileType: "csv" | "json" | "text";
};

type Props = {
  onFileReady: (file: FileInfo) => void;
};

function getFileIcon(name: string) {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "json") return FileJson;
  if (ext === "csv" || ext === "xlsx" || ext === "xls") return FileSpreadsheet;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(name: string): "csv" | "json" | "text" {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "csv" || ext === "xlsx" || ext === "xls") return "csv";
  if (ext === "json") return "json";
  return "text";
}

export function FileUploadZone({ onFileReady }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isReading, setIsReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    // Validate extension
    const ext = "." + file.name.toLowerCase().split(".").pop();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error(`Unsupported file type: ${ext}. Supported: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${formatFileSize(file.size)}). Maximum size is 5MB.`);
      return;
    }

    setIsReading(true);

    try {
      let content: string;
      const fileType = detectFileType(file.name);

      if (ext === ".xlsx" || ext === ".xls") {
        // Dynamic import SheetJS for Excel files
        try {
          const XLSX = await import("xlsx");
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });

          // Convert all sheets to CSV
          const sheets: string[] = [];
          for (const sheetName of workbook.SheetNames) {
            const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            if (csv.trim()) {
              sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
            }
          }
          content = sheets.join("\n\n");
        } catch {
          toast.error("Unable to read this Excel file. Try exporting as CSV.");
          setIsReading(false);
          return;
        }
      } else {
        content = await file.text();
      }

      if (!content.trim()) {
        toast.error("File appears to be empty.");
        setIsReading(false);
        return;
      }

      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        content,
        fileType,
      };

      setSelectedFile(fileInfo);
    } catch {
      toast.error("Failed to read file. Please try again.");
    } finally {
      setIsReading(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleClear = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.name) : Upload;

  if (selectedFile) {
    return (
      <div className="flex flex-col items-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10"
        >
          <FileIcon className="h-8 w-8 text-accent-primary" />
        </motion.div>

        <p className="text-sm font-medium text-text-primary">{selectedFile.name}</p>
        <p className="mt-1 text-xs text-text-tertiary">
          {formatFileSize(selectedFile.size)} &middot; {selectedFile.fileType.toUpperCase()}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
          <Button size="sm" onClick={() => onFileReady(selectedFile)}>
            <Sparkles className="h-3.5 w-3.5" />
            Analyze with AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-8 py-16 transition-all ${
        isDragging
          ? "border-accent-primary bg-accent-primary/5"
          : "border-border-glass hover:border-text-tertiary hover:bg-bg-card/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      <motion.div
        animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated"
      >
        <Upload
          className={`h-6 w-6 ${isDragging ? "text-accent-primary" : "text-text-tertiary"}`}
        />
      </motion.div>

      {isReading ? (
        <p className="text-sm text-text-secondary">Reading file…</p>
      ) : (
        <>
          <p className="text-sm font-medium text-text-secondary">
            {isDragging ? "Drop your file here" : "Drag & drop your CRM export file"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            or click to browse &middot; CSV, Excel, JSON, or Text &middot; Max 5MB
          </p>
        </>
      )}
    </div>
  );
}
