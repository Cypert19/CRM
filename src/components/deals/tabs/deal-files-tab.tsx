"use client";

import { useEffect, useState, useCallback } from "react";
import { FolderOpen, FileText, FileIcon, Image, Upload } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { getFiles } from "@/actions/files";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type FileRecord = Tables<"files">;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-8 w-8 text-accent-cyan" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-8 w-8 text-signal-danger" />;
  }
  return <FileIcon className="h-8 w-8 text-text-secondary" />;
}

export function DealFilesTab({ dealId }: { dealId: string }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    const result = await getFiles("deal", dealId);
    if (result.success && result.data) {
      setFiles(result.data);
    } else {
      toast.error(result.error || "Failed to load files");
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Files ({files.length})
        </h3>
        <Button size="sm" variant="secondary" disabled>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload Coming Soon
        </Button>
      </div>

      {files.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FolderOpen className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">No files yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Files attached to this deal will appear here.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <GlassCard key={file.id} hover className="!p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-bg-elevated/50 p-2">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {file.original_filename}
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {formatFileSize(file.file_size_bytes)}
                  </p>
                  {file.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                      {file.description}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-text-tertiary">
                    {formatRelativeTime(file.created_at)}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
