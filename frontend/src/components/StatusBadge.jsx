import React from "react";

const STATUS_STYLES = {
  queued: "bg-slate-400/15 text-slate-400 border-slate-400/30",
  searching: "bg-signal-cyan/15 text-signal-cyan border-signal-cyan/30",
  reading: "bg-signal-cyan/15 text-signal-cyan border-signal-cyan/30",
  writing: "bg-signal-amber/15 text-signal-amber border-signal-amber/30",
  reviewing: "bg-signal-amber/15 text-signal-amber border-signal-amber/30",
  completed: "bg-signal-success/15 text-signal-success border-signal-success/30",
  failed: "bg-signal-danger/15 text-signal-danger border-signal-danger/30",
};

const STATUS_LABELS = {
  queued: "Queued",
  searching: "Searching",
  reading: "Reading",
  writing: "Writing",
  reviewing: "Reviewing",
  completed: "Completed",
  failed: "Failed",
};

const ACTIVE_STATUSES = new Set(["searching", "reading", "writing", "reviewing"]);

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.queued;
  const label = STATUS_LABELS[status] || status;
  const isActive = ACTIVE_STATUSES.has(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono uppercase tracking-wide ${style}`}
    >
      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {label}
    </span>
  );
}
