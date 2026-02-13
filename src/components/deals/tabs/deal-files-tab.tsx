"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  FileIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  Download,
  Sparkles,
  Loader2,
  X,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { getKBFiles, deleteFile, type KBFileRecord } from "@/actions/files";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────

const SUGGESTED_CATEGORIES = [
  "Audit Data",
  "Technical Stack",
  "Training",
  "Employee Database",
  "Wireframes",
  "Contracts",
  "Proposals",
  "SOPs",
  "Architecture Diagrams",
  "Meeting Materials",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Audit Data": "bg-signal-info/20 text-signal-info",
  "Technical Stack": "bg-accent-cyan/20 text-accent-cyan",
  Training: "bg-signal-warning/20 text-signal-warning",
  "Employee Database": "bg-signal-success/20 text-signal-success",
  Wireframes: "bg-accent-primary/20 text-accent-glow",
  Contracts: "bg-signal-danger/20 text-signal-danger",
  Proposals: "bg-accent-primary/20 text-accent-glow",
  SOPs: "bg-signal-info/20 text-signal-info",
  "Architecture Diagrams": "bg-accent-cyan/20 text-accent-cyan",
  "Meeting Materials": "bg-signal-warning/20 text-signal-warning",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="h-8 w-8 text-accent-cyan" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-8 w-8 text-signal-danger" />;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return <FileSpreadsheet className="h-8 w-8 text-signal-success" />;
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileText className="h-8 w-8 text-signal-info" />;
  }
  return <FileIcon className="h-8 w-8 text-text-secondary" />;
}

function getCategoryColor(category: string | null): string {
  if (!category) return "bg-bg-elevated text-text-secondary";
  return CATEGORY_COLORS[category] || "bg-bg-elevated text-text-secondary";
}

// ─── Upload Dialog ──────────────────────────────────────────────────────────

function UploadDialog({
  dealId,
  onClose,
  onUploaded,
}: {
  dealId: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("deal_id", dealId);
      if (category.trim()) formData.append("category", category.trim());
      if (description.trim())
        formData.append("description", description.trim());

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Upload failed");
        setUploading(false);
        return;
      }

      const extractionInfo = result.extraction;
      if (extractionInfo?.hasText) {
        toast.success(
          `Uploaded! ${extractionInfo.charCount.toLocaleString()} chars extracted for AI.`
        );
      } else if (extractionInfo?.error) {
        toast.success(
          "Uploaded! Text extraction had an issue but file is saved."
        );
      } else {
        toast.success("File uploaded successfully!");
      }

      onUploaded();
      onClose();
    } catch {
      toast.error("Failed to upload file");
      setUploading(false);
    }
  };

  const filteredSuggestions = SUGGESTED_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(category.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg mx-4 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">
            Upload to Knowledge Base
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-tertiary hover:text-text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-colors",
            dragActive
              ? "border-accent-primary bg-accent-primary/5"
              : file
                ? "border-signal-success/40 bg-signal-success/5"
                : "border-border-glass hover:border-accent-primary/40 hover:bg-accent-primary/5"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
          {file ? (
            <>
              <div className="rounded-lg bg-bg-elevated/50 p-2">
                {getFileIcon(file.type)}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  {file.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  {formatFileSize(file.size)} · Click to change
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-text-tertiary" />
              <div className="text-center">
                <p className="text-sm font-medium text-text-secondary">
                  Drop file here or click to browse
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  PDF, Word, Excel, images, text · Max 25MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Category */}
        <div ref={categoryRef} className="relative">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Category
          </label>
          <div className="relative">
            <input
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., Technical Stack, Audit Data..."
              className="w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary/40 focus:outline-none focus:ring-1 focus:ring-accent-primary/20"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border-glass bg-bg-elevated shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setCategory(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-accent-primary/10 hover:text-text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Description{" "}
            <span className="text-text-tertiary font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this document..."
            rows={2}
            className="w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary/40 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DealFilesTab({ dealId }: { dealId: string }) {
  const [files, setFiles] = useState<KBFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KBFileRecord | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    const result = await getKBFiles(dealId, activeCategory);
    if (result.success && result.data) {
      setFiles(result.data);
    } else {
      toast.error(result.error || "Failed to load files");
    }
    setLoading(false);
  }, [dealId, activeCategory]);

  useEffect(() => {
    setLoading(true);
    fetchFiles();
  }, [fetchFiles]);

  // Derive categories from all files
  const categories = [
    ...new Set(files.map((f) => f.category).filter(Boolean) as string[]),
  ];

  const handleDownload = async (file: KBFileRecord) => {
    setDownloading(file.id);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 3600);

      if (error || !data?.signedUrl) {
        toast.error("Failed to generate download link");
        setDownloading(null);
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Download failed");
    }
    setDownloading(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteFile(deleteTarget.id, deleteTarget.storage_path);
    if (result.success) {
      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Knowledge Base ({files.length})
        </h3>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload Document
        </Button>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === null
                ? "bg-accent-primary/20 text-accent-glow"
                : "bg-bg-elevated/50 text-text-tertiary hover:text-text-secondary"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? getCategoryColor(cat)
                  : "bg-bg-elevated/50 text-text-tertiary hover:text-text-secondary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* File Grid */}
      {files.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">
              {activeCategory
                ? `No ${activeCategory} documents yet`
                : "No documents yet"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Upload documents to build your deal knowledge base.
              <br />
              PDFs, Word docs, and spreadsheets are automatically parsed for AI
              context.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload First Document
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <GlassCard key={file.id} hover className="!p-4 group">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-bg-elevated/50 p-2">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {file.original_filename}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-text-tertiary">
                      {formatFileSize(file.file_size_bytes)}
                    </span>
                    {file.category && (
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          getCategoryColor(file.category)
                        )}
                      >
                        {file.category}
                      </Badge>
                    )}
                    {file.has_extracted_text && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-cyan">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI Ready
                      </span>
                    )}
                  </div>
                  {file.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">
                      {file.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-text-tertiary">
                      {formatRelativeTime(file.created_at)}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={downloading === file.id}
                        className="rounded-md p-1 text-text-tertiary hover:text-accent-cyan transition-colors"
                        title="Download"
                      >
                        {downloading === file.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(file)}
                        className="rounded-md p-1 text-text-tertiary hover:text-signal-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <AnimatePresence>
        {showUpload && (
          <UploadDialog
            dealId={dealId}
            onClose={() => setShowUpload(false)}
            onUploaded={fetchFiles}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Document"
        description="This will permanently delete the file from storage and the knowledge base. The AI will no longer reference this document."
        entityName={deleteTarget?.original_filename || ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}
