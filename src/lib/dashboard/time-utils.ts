import type { TimeRange, TimeGrouping } from "@/types/dashboard";

/** Convert a TimeRange enum to a start Date */
export function getTimeRangeStart(timeRange: TimeRange): Date | null {
  const now = new Date();

  switch (timeRange) {
    case "last_7_days":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "last_30_days":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case "last_90_days":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    case "last_6_months":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "last_12_months":
      return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    case "this_month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), q, 1);
    }
    case "this_year":
      return new Date(now.getFullYear(), 0, 1);
    case "all_time":
      return null;
  }
}

/** Get the previous period start for comparison (same duration, shifted back) */
export function getPreviousPeriodStart(timeRange: TimeRange): Date | null {
  const start = getTimeRangeStart(timeRange);
  if (!start) return null;

  const now = new Date();
  const durationMs = now.getTime() - start.getTime();
  return new Date(start.getTime() - durationMs);
}

/** Get the previous period end (= current period start) */
export function getPreviousPeriodEnd(timeRange: TimeRange): Date | null {
  return getTimeRangeStart(timeRange);
}

/** Generate time bucket labels for a date range and grouping */
export function generateTimeBuckets(
  start: Date,
  end: Date,
  grouping: TimeGrouping
): { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    let bucketEnd: Date;
    let label: string;

    switch (grouping) {
      case "day":
        bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
        label = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        break;
      case "week": {
        bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
        const weekEnd = new Date(Math.min(bucketEnd.getTime(), end.getTime()));
        label = `${cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { day: "numeric" })}`;
        break;
      }
      case "month":
        bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        label = cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        break;
      case "quarter": {
        bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
        const qNum = Math.floor(cursor.getMonth() / 3) + 1;
        label = `Q${qNum} ${cursor.getFullYear().toString().slice(-2)}`;
        break;
      }
    }

    buckets.push({ label, start: new Date(cursor), end: bucketEnd });
    cursor.setTime(bucketEnd.getTime());
  }

  return buckets;
}
