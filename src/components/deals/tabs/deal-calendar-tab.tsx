"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  MapPin,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/gradient-button";
import { DealEventForm } from "./deal-event-form";
import { getDealEvents } from "@/actions/deal-events";
import { DEAL_EVENT_TYPE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type DealEvent = Tables<"deal_events">;

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-accent-primary/20 text-accent-primary",
  call: "bg-accent-cyan/20 text-accent-cyan",
  demo: "bg-accent-purple/20 text-accent-purple",
  follow_up: "bg-signal-warning/20 text-signal-warning",
  deadline: "bg-signal-danger/20 text-signal-danger",
  other: "bg-bg-elevated text-text-secondary",
};

const EVENT_TYPE_DOT_COLORS: Record<string, string> = {
  meeting: "bg-accent-primary",
  call: "bg-accent-cyan",
  demo: "bg-accent-purple",
  follow_up: "bg-signal-warning",
  deadline: "bg-signal-danger",
  other: "bg-text-secondary",
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: Array<{ date: number; month: number; year: number; isCurrentMonth: boolean }> = [];

  // Previous month fill
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, month, year, isCurrentMonth: true });
  }

  // Next month fill
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  return days;
}

function isSameDay(dateStr: string, year: number, month: number, day: number): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DealCalendarTab({ dealId }: { dealId: string }) {
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DealEvent | undefined>();
  const [selectedDay, setSelectedDay] = useState<{
    year: number;
    month: number;
    date: number;
  } | null>(null);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const fetchEvents = useCallback(async () => {
    const result = await getDealEvents(dealId);
    if (result.success && result.data) {
      setEvents(result.data);
    } else {
      toast.error(result.error || "Failed to load events");
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const getEventsForDay = useCallback(
    (year: number, month: number, date: number) =>
      events.filter((e) => isSameDay(e.start_time, year, month, date)),
    [events]
  );

  const selectedDayEvents = selectedDay
    ? getEventsForDay(selectedDay.year, selectedDay.month, selectedDay.date)
    : [];

  const isToday = (year: number, month: number, date: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === date;

  const isSelected = (year: number, month: number, date: number) =>
    selectedDay?.year === year &&
    selectedDay?.month === month &&
    selectedDay?.date === date;

  const handleDayClick = (year: number, month: number, date: number) => {
    const dayEvents = getEventsForDay(year, month, date);
    if (dayEvents.length > 0 || isSelected(year, month, date)) {
      if (isSelected(year, month, date)) {
        setSelectedDay(null);
      } else {
        setSelectedDay({ year, month, date });
      }
    } else {
      setSelectedDay({ year, month, date });
    }
  };

  const openEditForm = (event: DealEvent) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const openNewForm = () => {
    setEditingEvent(undefined);
    setFormOpen(true);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

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
          Calendar ({events.length} event{events.length !== 1 ? "s" : ""})
        </h3>
        <Button size="sm" onClick={openNewForm}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Event
        </Button>
      </div>

      {events.length === 0 && !formOpen ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">
              No events scheduled
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Schedule meetings, calls, and deadlines for this deal.
            </p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="!p-4">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 className="text-sm font-semibold text-text-primary">{monthName}</h4>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="mb-1 grid grid-cols-7 gap-px">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-text-tertiary"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day.year, day.month, day.date);
              const todayHighlight = isToday(day.year, day.month, day.date);
              const selected = isSelected(day.year, day.month, day.date);

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleDayClick(day.year, day.month, day.date)}
                  className={`relative flex min-h-[3rem] flex-col items-center rounded-lg p-1 transition-colors ${
                    day.isCurrentMonth
                      ? "text-text-primary"
                      : "text-text-tertiary/40"
                  } ${
                    selected
                      ? "bg-accent-primary/10 ring-1 ring-accent-primary/50"
                      : "hover:bg-bg-elevated/50"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      todayHighlight
                        ? "bg-accent-primary font-bold text-white"
                        : "font-medium"
                    }`}
                  >
                    {day.date}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="mt-0.5 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            EVENT_TYPE_DOT_COLORS[ev.event_type] || "bg-text-secondary"
                          }`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-text-tertiary">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Selected day event list */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <GlassCard className="!p-4">
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            {new Date(
              selectedDay.year,
              selectedDay.month,
              selectedDay.date
            ).toLocaleDateString("default", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h4>
          <div className="space-y-2">
            {selectedDayEvents.map((event) => (
              <button
                type="button"
                key={event.id}
                onClick={() => openEditForm(event)}
                className="flex w-full items-start gap-3 rounded-xl bg-bg-elevated/30 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/50"
              >
                <div
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    EVENT_TYPE_DOT_COLORS[event.event_type] || "bg-text-secondary"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {event.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        EVENT_TYPE_COLORS[event.event_type] || ""
                      }
                    >
                      {DEAL_EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      {formatTime(event.start_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 text-xs text-text-tertiary">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">
                      {event.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {selectedDay && selectedDayEvents.length === 0 && (
        <div className="text-center text-xs text-text-tertiary">
          No events on this day.
        </div>
      )}

      <DealEventForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingEvent(undefined);
            fetchEvents();
          }
        }}
        dealId={dealId}
        event={editingEvent}
      />
    </div>
  );
}
