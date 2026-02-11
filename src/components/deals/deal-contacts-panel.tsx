"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { User, Plus, X, Star, Users, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/gradient-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CONTACT_ROLES } from "@/lib/constants";
import {
  getDealContacts,
  addDealContact,
  updateDealContactRole,
  removeDealContact,
} from "@/actions/deal-contacts";
import { getContacts } from "@/actions/contacts";
import type { Tables } from "@/types/database";

type DealContactWithDetails = Tables<"deal_contacts"> & {
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
  };
};

type Props = {
  dealId: string;
};

const ROLE_BADGE_VARIANT: Record<string, "success" | "default" | "info" | "danger" | "secondary"> = {
  "Decision Maker": "success",
  Champion: "default",
  Influencer: "info",
  Blocker: "danger",
  "End User": "secondary",
};

export function DealContactsPanel({ dealId }: Props) {
  const [dealContacts, setDealContacts] = useState<DealContactWithDetails[]>([]);
  const [allContacts, setAllContacts] = useState<Tables<"contacts">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchDealContacts = useCallback(async () => {
    const result = await getDealContacts(dealId);
    if (result.success && result.data) {
      setDealContacts(result.data);
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchDealContacts();
  }, [fetchDealContacts]);

  // Fetch all contacts when the search dropdown opens
  useEffect(() => {
    if (showSearch && allContacts.length === 0) {
      getContacts().then((result) => {
        if (result.success && result.data) {
          setAllContacts(result.data);
        }
      });
    }
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch, allContacts.length]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
        setSearchQuery("");
      }
    }
    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSearch]);

  const linkedContactIds = new Set(dealContacts.map((dc) => dc.contact_id));

  const filteredContacts = allContacts.filter((contact) => {
    if (linkedContactIds.has(contact.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const email = (contact.email || "").toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const handleAddContact = async (contactId: string) => {
    setAdding(true);
    const result = await addDealContact({
      deal_id: dealId,
      contact_id: contactId,
      role: null,
      is_primary: false,
    });
    setAdding(false);

    if (result.success) {
      toast.success("Contact added to deal");
      setShowSearch(false);
      setSearchQuery("");
      fetchDealContacts();
    } else {
      toast.error(result.error || "Failed to add contact");
    }
  };

  const handleRoleChange = async (dealContactId: string, role: string) => {
    const roleValue = role === "__none__" ? null : role as DealContactWithDetails["role"];
    const result = await updateDealContactRole({
      id: dealContactId,
      role: roleValue,
    });

    if (result.success) {
      setDealContacts((prev) =>
        prev.map((dc) =>
          dc.id === dealContactId ? { ...dc, role: roleValue } : dc
        )
      );
      toast.success("Role updated");
    } else {
      toast.error(result.error || "Failed to update role");
    }
  };

  const handleTogglePrimary = async (dealContactId: string, currentlyPrimary: boolean) => {
    const result = await updateDealContactRole({
      id: dealContactId,
      is_primary: !currentlyPrimary,
    });

    if (result.success) {
      setDealContacts((prev) =>
        prev.map((dc) =>
          dc.id === dealContactId
            ? { ...dc, is_primary: !currentlyPrimary }
            : currentlyPrimary
              ? dc
              : { ...dc, is_primary: false }
        )
      );
      toast.success(
        !currentlyPrimary ? "Set as primary contact" : "Removed primary status"
      );
    } else {
      toast.error(result.error || "Failed to update primary status");
    }
  };

  const handleRemoveContact = async (dealContactId: string) => {
    setRemovingId(dealContactId);
    const result = await removeDealContact(dealContactId);
    setRemovingId(null);

    if (result.success) {
      setDealContacts((prev) => prev.filter((dc) => dc.id !== dealContactId));
      toast.success("Contact removed from deal");
    } else {
      toast.error(result.error || "Failed to remove contact");
    }
  };

  return (
    <GlassCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-primary">
            Deal Contacts
          </h3>
          {dealContacts.length > 0 && (
            <span className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
              {dealContacts.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch((prev) => !prev)}
          title="Add contact"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Dropdown */}
      {showSearch && (
        <div ref={searchContainerRef} className="mb-4 relative">
          <div className="glass-panel-dense rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <Search className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-tertiary">
                  {allContacts.length === 0
                    ? "Loading contacts..."
                    : "No matching contacts found"}
                </div>
              ) : (
                filteredContacts.slice(0, 10).map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleAddContact(contact.id)}
                    disabled={adding}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-elevated/50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated shrink-0">
                      <User className="h-3.5 w-3.5 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.email && (
                        <p className="text-[11px] text-text-tertiary truncate">
                          {contact.email}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      ) : dealContacts.length === 0 ? (
        <div className="py-6 text-center">
          <Users className="mx-auto h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-sm text-text-tertiary">No contacts linked</p>
          <p className="text-xs text-text-tertiary/70 mt-1">
            Click + to add contacts to this deal
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {dealContacts.map((dc) => (
            <div
              key={dc.id}
              className="group rounded-lg px-3 py-2.5 hover:bg-bg-elevated/30 transition-colors"
            >
              {/* Top row: avatar, name, primary star, remove */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated shrink-0">
                  <User className="h-3.5 w-3.5 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contacts/${dc.contacts.id}`}
                      className="text-sm font-medium text-text-primary hover:text-accent-primary transition-colors truncate"
                    >
                      {dc.contacts.first_name} {dc.contacts.last_name}
                    </Link>
                    {dc.is_primary && (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                        Primary
                      </Badge>
                    )}
                  </div>
                  {dc.contacts.job_title && (
                    <p className="text-[11px] text-text-secondary truncate">
                      {dc.contacts.job_title}
                    </p>
                  )}
                  {dc.contacts.email && (
                    <p className="text-[11px] text-text-tertiary truncate">
                      {dc.contacts.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePrimary(dc.id, dc.is_primary)}
                    title={dc.is_primary ? "Remove primary" : "Set as primary"}
                    className={`p-1 rounded transition-colors ${
                      dc.is_primary
                        ? "text-signal-warning"
                        : "text-text-tertiary/40 hover:text-signal-warning opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Star
                      className="h-3.5 w-3.5"
                      fill={dc.is_primary ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => handleRemoveContact(dc.id)}
                    disabled={removingId === dc.id}
                    title="Remove contact"
                    className="p-1 rounded text-text-tertiary/40 hover:text-signal-danger opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div className="mt-2 ml-11">
                {dc.role ? (
                  <div className="flex items-center gap-2">
                    <Badge variant={ROLE_BADGE_VARIANT[dc.role] || "secondary"}>
                      {dc.role}
                    </Badge>
                    <Select
                      value={dc.role || "__none__"}
                      onValueChange={(val) => handleRoleChange(dc.id, val)}
                    >
                      <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent opacity-0 group-hover:opacity-100 transition-opacity [&>svg]:h-3 [&>svg]:w-3">
                        <span className="sr-only">Change role</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Role</SelectItem>
                        {CONTACT_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Select
                    value="__none__"
                    onValueChange={(val) => handleRoleChange(dc.id, val)}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs text-text-tertiary opacity-60 group-hover:opacity-100 transition-opacity">
                      <SelectValue placeholder="Set role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No Role</SelectItem>
                      {CONTACT_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
