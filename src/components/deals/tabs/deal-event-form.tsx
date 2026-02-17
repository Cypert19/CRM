"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDealEvent, updateDealEvent } from "@/actions/deal-events";
import { DEAL_EVENT_TYPES, DEAL_EVENT_TYPE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type DealEventFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  event?: Tables<"deal_events">;
};

export function DealEventForm({
  open,
  onOpenChange,
  dealId,
  event,
}: DealEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState<string>("meeting");
  const [location, setLocation] = useState("");

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartTime(formatDatetimeLocal(event.start_time));
      setEndTime(event.end_time ? formatDatetimeLocal(event.end_time) : "");
      setEventType(event.event_type);
      setLocation(event.location || "");
    } else {
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setEventType("meeting");
      setLocation("");
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      deal_id: dealId,
      title: title.trim(),
      description: description.trim() || null,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : null,
      event_type: eventType,
      location: location.trim() || null,
    };

    const result = isEditing
      ? await updateDealEvent({ id: event.id, ...payload })
      : await createDealEvent(payload);

    setLoading(false);

    if (result.success) {
      toast.success(isEditing ? "Event updated" : "Event created");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to save event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description (optional)"
              rows={3}
              className="focus-ring glass-panel w-full resize-none rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="focus-ring glass-panel-dense w-full rounded-lg px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="focus-ring glass-panel-dense w-full rounded-lg px-3 py-2 text-sm text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Event Type
            </label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DEAL_EVENT_TYPE_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
