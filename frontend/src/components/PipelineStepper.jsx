import React from "react";

const STEPS = [
  { key: "searching", label: "Search", timingKey: "search", desc: "Scanning the web", outputKey: "searchResults" },
  { key: "reading", label: "Read", timingKey: "reading", desc: "Scraping top source", outputKey: "scrapedContent" },
  { key: "writing", label: "Write", timingKey: "writing", desc: "Drafting the report", outputKey: "report" },
  { key: "reviewing", label: "Review", timingKey: "critic", desc: "Critic is scoring it", outputKey: "criticFeedback" },
];

const ORDER = ["queued", "searching", "reading", "writing", "reviewing", "completed"];

export default function PipelineStepper({
  status,
  timings = {},
  error,
  searchResults,
  scrapedContent,
  report,
  criticFeedback,
}) {
  const currentIndex = ORDER.indexOf(status);
  const outputs = { searchResults, scrapedContent, report, criticFeedback };

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm tracking-wide">Agent Pipeline</h3>
        {error && <span className="text-xs font-mono text-signal-danger">run failed</span>}
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const stepIndex = ORDER.indexOf(step.key);
          const isDone = status === "completed" || currentIndex > stepIndex;
          const isActive = status === step.key;
          const isFailed = status === "failed" && !isDone;
          const time = timings?.[step.timingKey];
          const content = outputs[step.outputKey];

          return (
            <div
              key={step.key}
              className="flex gap-3 border border-paper-border dark:border-ink-border rounded-lg p-3"
            >
              <div
                className={[
                  "h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-mono text-xs border-2 transition-all",
                  isDone
                    ? "bg-signal-success/15 border-signal-success text-signal-success"
                    : isActive
                    ? "bg-signal-amber/15 border-signal-amber text-signal-amber animate-pulse"
                    : isFailed
                    ? "bg-signal-danger/15 border-signal-danger text-signal-danger"
                    : "bg-transparent border-paper-border dark:border-ink-border text-slate-400",
                ].join(" ")}
              >
                {isDone ? "✓" : String(i + 1).padStart(2, "0")}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-display font-semibold">{step.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      {step.desc}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-signal-cyan shrink-0">
                    {time != null ? `${time}s` : isActive ? "…" : ""}
                  </span>
                </div>

                {content && (isDone || isActive) && (
                  <details className="mt-2 group">
                    <summary className="cursor-pointer text-xs text-signal-cyan hover:underline select-none">
                      View output
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-h-56 overflow-y-auto bg-black/[0.03] dark:bg-white/[0.03] rounded-md p-3 font-body">
                      {content}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-xs font-mono text-signal-danger border border-signal-danger/30 bg-signal-danger/10 rounded-lg p-3">
          {error}
        </p>
      )}
    </div>
  );
}