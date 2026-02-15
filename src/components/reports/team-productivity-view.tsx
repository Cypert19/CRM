"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ReportKPICard } from "./report-kpi-card";
import { AlertTriangle, CheckCircle2, Clock, Timer, ChevronDown, ChevronRight } from "lucide-react";
import type { TeamProductivityData, MemberProductivity } from "@/actions/reports";
import Link from "next/link";

const priorityColors: Record<string, string> = {
  Urgent: "bg-signal-danger/20 text-signal-danger",
  High: "bg-orange-500/20 text-orange-400",
  Medium: "bg-signal-warning/20 text-signal-warning",
  Low: "bg-text-tertiary/20 text-text-tertiary",
};

function formatMinutes(min: number): string {
  if (min === 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MemberRow({ member }: { member: MemberProductivity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="group cursor-pointer border-b border-border-glass/50 transition-colors hover:bg-bg-elevated/50"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Member */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <button className="shrink-0 text-text-tertiary">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated">
                <span className="text-[10px] font-medium text-text-secondary">
                  {member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-text-primary truncate">
              {member.full_name}
            </span>
          </div>
        </td>
        {/* Total */}
        <td className="py-3 px-3 text-center text-sm text-text-secondary">{member.total_tasks}</td>
        {/* Done */}
        <td className="py-3 px-3 text-center text-sm text-signal-success">{member.completed_tasks}</td>
        {/* Overdue */}
        <td className="py-3 px-3 text-center">
          <span className={`text-sm font-semibold ${member.overdue_tasks > 0 ? "text-signal-danger" : "text-text-tertiary"}`}>
            {member.overdue_tasks}
          </span>
        </td>
        {/* In Progress */}
        <td className="py-3 px-3 text-center text-sm text-accent-cyan">{member.in_progress_tasks}</td>
        {/* Completion % */}
        <td className="py-3 px-3 text-center">
          <span className={`text-sm font-medium ${member.completion_rate >= 80 ? "text-signal-success" : member.completion_rate >= 50 ? "text-signal-warning" : "text-signal-danger"}`}>
            {member.completion_rate}%
          </span>
        </td>
        {/* Avg Focus */}
        <td className="py-3 px-3 text-center text-sm text-text-secondary">
          {member.tasks_with_focus_data > 0 ? formatMinutes(member.avg_completion_minutes) : "—"}
        </td>
        {/* Avg Days */}
        <td className="py-3 px-3 text-center text-sm text-text-secondary">
          {member.avg_days_to_complete > 0 ? `${member.avg_days_to_complete}d` : "—"}
        </td>
        {/* On-Time % */}
        <td className="py-3 px-3 text-center">
          <span className={`text-sm font-medium ${member.on_time_rate >= 80 ? "text-signal-success" : member.on_time_rate >= 50 ? "text-signal-warning" : "text-signal-danger"}`}>
            {member.on_time_rate > 0 ? `${member.on_time_rate}%` : "—"}
          </span>
        </td>
      </tr>

      {/* Expanded: Overdue task detail */}
      {expanded && member.overdue_task_list.length > 0 && (
        <tr>
          <td colSpan={9} className="bg-bg-elevated/30 px-4 py-3">
            <div className="ml-10 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-signal-danger mb-2">
                Overdue Tasks ({member.overdue_task_list.length})
              </p>
              {member.overdue_task_list.map((task) => (
                <div key={task.id} className="flex items-center gap-3 text-sm">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[task.priority] || ""}`}>
                    {task.priority}
                  </span>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-text-primary hover:text-accent-primary truncate max-w-[300px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.title}
                  </Link>
                  {task.deal_title && (
                    <span className="text-[10px] text-text-tertiary truncate max-w-[150px]">
                      ({task.deal_title})
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs font-semibold text-signal-danger">
                    {task.days_overdue}d overdue
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
      {expanded && member.overdue_task_list.length === 0 && (
        <tr>
          <td colSpan={9} className="bg-bg-elevated/30 px-4 py-3">
            <p className="ml-10 text-sm text-text-tertiary">No overdue tasks</p>
          </td>
        </tr>
      )}
    </>
  );
}

export function TeamProductivityView({ data }: { data: TeamProductivityData }) {
  const { members, team_totals } = data;

  if (members.length === 0) {
    return (
      <GlassCard className="py-12 text-center">
        <Clock className="mx-auto h-10 w-10 text-text-tertiary/50" />
        <p className="mt-3 text-sm text-text-secondary">No team data available</p>
        <p className="mt-1 text-xs text-text-tertiary">
          Assign tasks to team members to see productivity metrics
        </p>
      </GlassCard>
    );
  }

  // Focus time bar chart data
  const focusMembers = members.filter((m) => m.total_focus_minutes > 0);
  const maxFocusMinutes = Math.max(...focusMembers.map((m) => m.total_focus_minutes), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ReportKPICard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Total Overdue"
          value={team_totals.total_overdue}
          format="number"
          subtitle="across all members"
          glow="danger"
          delay={0}
        />
        <ReportKPICard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completion Rate"
          value={team_totals.avg_completion_rate}
          format="percent"
          subtitle={`${team_totals.total_completed} of ${team_totals.total_tasks} tasks`}
          glow="success"
          delay={0.1}
        />
        <ReportKPICard
          icon={<Timer className="h-4 w-4" />}
          label="Avg Focus Time"
          value={team_totals.avg_focus_minutes}
          format="number"
          subtitle="minutes per task"
          glow="cyan"
          delay={0.2}
        />
        <ReportKPICard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Tasks Completed"
          value={team_totals.total_completed}
          format="number"
          subtitle="total all time"
          glow="violet"
          delay={0.3}
        />
      </div>

      {/* Per-Member Breakdown Table */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border-glass bg-bg-elevated/30">
                <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Member
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Total
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Done
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Overdue
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  In Progress
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Completion
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Avg Focus
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Avg Days
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  On-Time
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <MemberRow key={member.user_id} member={member} />
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Focus Time Distribution */}
      {focusMembers.length > 0 && (
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Focus Time Distribution</h3>
          <div className="space-y-3">
            {focusMembers
              .sort((a, b) => b.total_focus_minutes - a.total_focus_minutes)
              .map((member) => (
                <div key={member.user_id} className="flex items-center gap-3">
                  <span className="w-28 truncate text-xs text-text-secondary">{member.full_name}</span>
                  <div className="flex-1 h-5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-violet transition-all duration-700"
                      style={{ width: `${(member.total_focus_minutes / maxFocusMinutes) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-medium text-text-secondary">
                    {formatMinutes(member.total_focus_minutes)}
                  </span>
                  <span className="w-16 text-right text-[10px] text-text-tertiary">
                    ({member.tasks_with_focus_data} tasks)
                  </span>
                </div>
              ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
