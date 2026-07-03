import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { createResearch } from "../api/client";

const SUGGESTIONS = [
  "Impact of quantum computing on cryptography",
  "State of solid-state EV batteries in 2026",
  "How CRISPR is being used in agriculture",
];

export default function NewResearch() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (topic.trim().length < 3) {
      setError("Give your topic at least 3 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await createResearch(topic.trim());
      navigate(`/report/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not start research.");
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-signal-amber mb-2">NEW RUN</p>
        <h1 className="font-display font-semibold text-2xl mb-2">What should the agents research?</h1>
        <p className="text-slate-500 text-sm mb-8">
          Search, Reader, Writer and Critic agents will run in sequence — you'll see live progress
          on the report page.
        </p>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <div>
            <label className="label">Research topic</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Impact of quantum computing on modern cryptography"
              maxLength={300}
            />
            <div className="text-right text-[11px] font-mono text-slate-400 mt-1">
              {topic.length}/300
            </div>
          </div>

          {error && (
            <p className="text-xs font-mono text-signal-danger bg-signal-danger/10 border border-signal-danger/30 rounded-lg p-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Dispatching agents…" : "Start research →"}
          </button>
        </form>

        <div className="mt-6">
          <p className="label mb-2">Try one of these</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                type="button"
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-paper-border dark:border-ink-border hover:border-signal-amber hover:text-signal-amber transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
