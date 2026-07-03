import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AppShell from "../components/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PipelineStepper from "../components/PipelineStepper.jsx";
import RatingStars from "../components/RatingStars.jsx";
import { deleteResearch, downloadResearchExport, getResearch, submitFeedback } from "../api/client";

const ACTIVE_STATUSES = new Set(["queued", "searching", "reading", "writing", "reviewing"]);

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pollRef = useRef(null);

  const fetchReport = useCallback(async () => {
    const { data } = await getResearch(id);
    setReport(data);
    setRating(data.rating || 0);
    setComment(data.comment || "");
    return data;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await fetchReport();
        if (!cancelled) setLoading(false);
        if (data && ACTIVE_STATUSES.has(data.status)) {
          pollRef.current = setTimeout(tick, 2000);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(pollRef.current);
    };
  }, [fetchReport]);

  const handleFeedback = async () => {
    setSavingFeedback(true);
    try {
      await submitFeedback(id, { rating, comment });
      await fetchReport();
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      await downloadResearchExport(id, fmt, `${report.topic.slice(0, 40)}.${fmt === "pdf" ? "pdf" : "md"}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this research report? This can't be undone.")) return;
    await deleteResearch(id);
    navigate("/history");
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-slate-500 font-mono">loading report…</p>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell>
        <p className="text-sm text-signal-danger font-mono">Report not found.</p>
      </AppShell>
    );
  }

  const isRunning = ACTIVE_STATUSES.has(report.status);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-mono text-xs tracking-widest text-signal-amber mb-2">REPORT</p>
          <h1 className="font-display font-semibold text-2xl">{report.topic}</h1>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <p className="text-[11px] font-mono text-slate-400 mb-6">
        Started {new Date(report.created_at).toLocaleString()}
        {report.completed_at && ` · Completed ${new Date(report.completed_at).toLocaleString()}`}
      </p>

      <div className="mb-6">
         <PipelineStepper
    status={report.status}
    timings={report.agent_timings}
    error={report.error}
    searchResults={report.search_results}
    scrapedContent={report.scraped_content}
    report={report.report}
    criticFeedback={report.critic_feedback}
           />
      </div>

      {isRunning && (
        <div className="panel p-4 mb-6 text-sm text-slate-500 font-mono flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal-amber animate-pulse" />
          Agents are working — this page updates automatically.
        </div>
      )}

      {report.status === "completed" && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => handleExport("pdf")} disabled={exporting} className="btn-secondary">
              ⇩ Export PDF
            </button>
            <button onClick={() => handleExport("markdown")} disabled={exporting} className="btn-secondary">
              ⇩ Export Markdown
            </button>
            <button onClick={handleDelete} className="btn-secondary text-signal-danger ml-auto">
              Delete report
            </button>
          </div>

          <Section title="Report">
            <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display">
              <ReactMarkdown>{report.report || "_No report content._"}</ReactMarkdown>
            </article>
          </Section>

          <Section title="Critic Feedback">
            <p className="text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {report.critic_feedback || "No critic feedback recorded."}
            </p>
          </Section>

          <Section title={`Source References (${report.sources?.length || 0})`}>
            {report.sources?.length ? (
              <ul className="space-y-1.5">
                {report.sources.map((s) => (
                  <li key={s} className="text-sm truncate">
                    <a
                      href={s}
                      target="_blank"
                      rel="noreferrer"
                      className="text-signal-cyan hover:underline font-mono text-xs break-all"
                    >
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No sources recorded for this run.</p>
            )}
          </Section>

          <Section title="Rate this report">
            <div className="flex items-center gap-3 mb-3">
              <RatingStars value={rating} onChange={setRating} />
            </div>
            <textarea
              className="input min-h-[80px] resize-none mb-3"
              placeholder="Optional comment — what worked, what didn't?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              onClick={handleFeedback}
              disabled={savingFeedback || rating === 0}
              className="btn-primary"
            >
              {savingFeedback ? "Saving…" : "Save feedback"}
            </button>
          </Section>
        </>
      )}

      {report.status === "failed" && (
        <div className="panel p-6 text-center">
          <p className="text-signal-danger text-sm mb-4">
            This research run failed. You can safely delete it and try again.
          </p>
          <button onClick={handleDelete} className="btn-secondary text-signal-danger">
            Delete report
          </button>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <div className="panel p-5 mb-6">
      <h2 className="font-display font-semibold text-sm tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}
