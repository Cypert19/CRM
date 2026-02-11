"use client";

import { FolderOpen, FileIcon, Image, FileText as FileTextIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { Tables } from "@/types/database";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf")) return FileTextIcon;
  return FileIcon;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesView({ files }: { files: Tables<"files">[] }) {
  if (files.length === 0) {
    return <EmptyState icon={FolderOpen} title="No files yet" description="Upload files by associating them with deals, contacts, or companies." />;
  }

  return (
    <>
      <PageHeader title="Files" description="Manage your documents" />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const Icon = getFileIcon(file.mime_type);
          return (
            <GlassCard key={file.id} hover className="cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated">
                  <Icon className="h-5 w-5 text-accent-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{file.original_filename}</p>
                  <p className="text-xs text-text-tertiary">{formatFileSize(file.file_size_bytes)} · {formatRelativeTime(file.created_at)}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}
