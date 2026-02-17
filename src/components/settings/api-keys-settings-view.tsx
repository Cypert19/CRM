"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/actions/api-keys";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { toast } from "sonner";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  ShieldAlert,
  Clock,
  Ban,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

type ApiKeyInfo = {
  id: string;
  key_prefix: string;
  name: string;
  description: string | null;
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
  creator?: { full_name: string } | null;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(dateStr: string | null) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function ApiKeysSettingsView({
  apiKeys: initialKeys,
  isAdmin = false,
}: {
  apiKeys: ApiKeyInfo[];
  isAdmin?: boolean;
}) {
  const [keys, setKeys] = useState(initialKeys);

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // New key reveal dialog state
  const [newKeyRevealed, setNewKeyRevealed] = useState<{
    raw_key: string;
    key_prefix: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);

  // Revoke dialog state
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyInfo | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Delete dialog state
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyInfo | null>(null);

  const activeKeys = keys.filter((k) => !k.is_revoked);
  const revokedKeys = keys.filter((k) => k.is_revoked);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    setCreating(true);
    const result = await createApiKey({
      name: newKeyName.trim(),
      description: newKeyDescription.trim() || undefined,
    });
    setCreating(false);

    if (result.success && result.data) {
      setShowCreateDialog(false);
      setNewKeyName("");
      setNewKeyDescription("");
      setNewKeyRevealed({
        raw_key: result.data.raw_key,
        key_prefix: result.data.key_prefix,
        name: newKeyName.trim(),
      });
      // Refresh page to get updated list
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to create API key");
    }
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    setRevoking(true);
    const result = await revokeApiKey(keyToRevoke.id);
    setRevoking(false);

    if (result.success) {
      toast.success(`API key "${keyToRevoke.name}" has been revoked`);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyToRevoke.id ? { ...k, is_revoked: true } : k
        )
      );
    } else {
      toast.error(result.error || "Failed to revoke API key");
    }
    setKeyToRevoke(null);
  };

  const handleDelete = async () => {
    if (!keyToDelete) return;
    const result = await deleteApiKey(keyToDelete.id);

    if (result.success) {
      toast.success(`API key "${keyToDelete.name}" has been deleted`);
      setKeys((prev) => prev.filter((k) => k.id !== keyToDelete.id));
    } else {
      toast.error(result.error || "Failed to delete API key");
    }
    setKeyToDelete(null);
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (!isAdmin) {
    return (
      <GlassCard>
        <div className="py-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-text-tertiary/50" />
          <p className="mt-3 text-sm text-text-secondary">Admin Access Required</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Only workspace administrators can manage API keys.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary + Create Button */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-accent-violet" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {activeKeys.length} Active{" "}
                {activeKeys.length === 1 ? "Key" : "Keys"}
              </h3>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {revokedKeys.length} revoked ·{" "}
                {keys.length} total
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-3.5 w-3.5" />
            Create API Key
          </Button>
        </div>
      </GlassCard>

      {/* Active Keys */}
      {activeKeys.length > 0 && (
        <div className="space-y-2">
          {activeKeys.map((key) => (
            <GlassCard key={key.id}>
              <div className="flex items-center gap-4">
                {/* Key icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-violet/10">
                  <KeyRound className="h-5 w-5 text-accent-violet" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {key.name}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-signal-success/20 px-2 py-0.5 text-[10px] font-medium text-signal-success">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs text-text-tertiary font-mono">
                      {key.key_prefix}...
                    </code>
                    {key.description && (
                      <>
                        <span className="text-text-tertiary">·</span>
                        <span className="text-xs text-text-tertiary truncate">
                          {key.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-signal-warning hover:bg-signal-warning/10"
                    onClick={() => setKeyToRevoke(key)}
                    title="Revoke key"
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-signal-danger hover:bg-signal-danger/10"
                    onClick={() => setKeyToDelete(key)}
                    title="Delete key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Meta info */}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created {formatDate(key.created_at)}
                </span>
                <span>
                  Last used: {formatRelative(key.last_used_at)}
                </span>
                {key.expires_at && (
                  <span>
                    Expires: {formatDate(key.expires_at)}
                  </span>
                )}
                {(key as ApiKeyInfo & { creator?: { full_name: string } | null }).creator && (
                  <span>
                    By: {(key as ApiKeyInfo & { creator?: { full_name: string } | null }).creator?.full_name}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Revoked Keys
          </h3>
          <div className="space-y-2">
            {revokedKeys.map((key) => (
              <GlassCard key={key.id} className="opacity-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
                    <Ban className="h-5 w-5 text-text-tertiary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary truncate line-through">
                        {key.name}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-signal-danger/20 px-2 py-0.5 text-[10px] font-medium text-signal-danger">
                        Revoked
                      </span>
                    </div>
                    <code className="text-xs text-text-tertiary font-mono">
                      {key.key_prefix}...
                    </code>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-signal-danger hover:bg-signal-danger/10 shrink-0"
                    onClick={() => setKeyToDelete(key)}
                    title="Delete key permanently"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="mt-2 flex items-center gap-4 text-[10px] text-text-tertiary">
                  <span>Created {formatDate(key.created_at)}</span>
                  <span>Last used: {formatRelative(key.last_used_at)}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {keys.length === 0 && (
        <GlassCard>
          <div className="py-8 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-text-tertiary/50" />
            <p className="mt-3 text-sm text-text-secondary">No API keys yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Create an API key to enable external integrations and agents to
              interact with your CRM data.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="mt-4"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Your First API Key
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for external integrations. The key will only
              be shown once — make sure to copy it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Key Name <span className="text-signal-danger">*</span>
              </label>
              <Input
                placeholder='e.g. "Manus Agent", "Zapier Integration"'
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creating) handleCreate();
                }}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Description{" "}
                <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <Input
                placeholder="What is this key used for?"
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateDialog(false);
                setNewKeyName("");
                setNewKeyDescription("");
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
            >
              <KeyRound className="h-3.5 w-3.5" />
              {creating ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal New Key Dialog */}
      <Dialog
        open={!!newKeyRevealed}
        onOpenChange={(open) => {
          if (!open) {
            setNewKeyRevealed(null);
            setCopied(false);
            setKeyVisible(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal-success/10">
              <Check className="h-6 w-6 text-signal-success" />
            </div>
            <DialogTitle className="text-center">API Key Created</DialogTitle>
            <DialogDescription className="text-center">
              Your API key <strong>&quot;{newKeyRevealed?.name}&quot;</strong> has been
              created. Copy it now — you won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>

          {/* Key display */}
          <div className="rounded-lg border border-border-subtle bg-bg-elevated/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 break-all text-sm font-mono text-text-primary">
                {keyVisible
                  ? newKeyRevealed?.raw_key
                  : `${newKeyRevealed?.key_prefix}${"•".repeat(40)}`}
              </code>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyVisible(!keyVisible)}
                  title={keyVisible ? "Hide key" : "Show key"}
                >
                  {keyVisible ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    newKeyRevealed && handleCopyKey(newKeyRevealed.raw_key)
                  }
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-signal-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-signal-warning/5 border border-signal-warning/20 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-signal-warning shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Store this key securely. It cannot be retrieved after you close this
              dialog. If you lose it, you&apos;ll need to create a new key.
            </p>
          </div>

          <div className="rounded-lg bg-bg-elevated/30 px-3 py-2">
            <p className="text-xs text-text-tertiary mb-1">Usage example:</p>
            <code className="text-[11px] font-mono text-text-secondary block">
              curl -H &quot;Authorization: Bearer {'<'}your-key{'>'}&quot; \<br />
              &nbsp;&nbsp;{typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/v1/deals
            </code>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              size="sm"
              onClick={() =>
                newKeyRevealed && handleCopyKey(newKeyRevealed.raw_key)
              }
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy API Key
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewKeyRevealed(null);
                setCopied(false);
                setKeyVisible(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Confirmation */}
      <Dialog
        open={!!keyToRevoke}
        onOpenChange={(open) => !open && setKeyToRevoke(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal-warning/10">
              <Ban className="h-6 w-6 text-signal-warning" />
            </div>
            <DialogTitle className="text-center">Revoke API Key</DialogTitle>
            <DialogDescription className="text-center">
              This will immediately disable the key. Any integrations using this
              key will stop working. The key record will be kept for audit
              purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-bg-elevated/50 px-4 py-3 text-center">
            <p className="text-sm font-medium text-text-primary">
              {keyToRevoke?.name}
            </p>
            <code className="text-xs text-text-tertiary font-mono">
              {keyToRevoke?.key_prefix}...
            </code>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setKeyToRevoke(null)}
              disabled={revoking}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              disabled={revoking}
              className="border-signal-warning/30 text-signal-warning hover:bg-signal-warning/10"
            >
              {revoking ? "Revoking..." : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Key Confirmation */}
      <ConfirmDeleteDialog
        open={!!keyToDelete}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
        title="Delete API Key"
        description={`Are you sure you want to permanently delete the API key "${keyToDelete?.name || ""}"? This action cannot be undone.`}
        entityName={keyToDelete?.name || "API Key"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
