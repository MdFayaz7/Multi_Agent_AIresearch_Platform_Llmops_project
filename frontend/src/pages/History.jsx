import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { deleteResearch, listResearch } from "../api/client";

const STATUS_OPTIONS = ["", "queued", "searching", "reading", "writing", "reviewing", "completed", "failed"];

export default function History() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await listResearch({
        search: search || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: pageSize,
      });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sortBy, sortDir, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this research report? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await deleteResearch(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell>
      <p className="font-mono text-xs tracking-widest text-signal-amber mb-2">ARCHIVE</p>
      <h1 className="font-display font-semibold text-2xl mb-6">Research History</h1>

      <div className="panel p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <input
          className="input flex-1"
          placeholder="Search topics…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input md:w-44"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? s[0].toUpperCase() + s.slice(1) : "All statuses"}
            </option>
          ))}
        </select>
        <select
          className="input md:w-44"
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split(":");
            setSortBy(sb);
            setSortDir(sd);
          }}
        >
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="topic:asc">Topic A–Z</option>
          <option value="topic:desc">Topic Z–A</option>
          <option value="rating:desc">Highest rated</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 font-mono">loading…</p>
      ) : items.length === 0 ? (
        <div className="panel p-10 text-center text-slate-500 text-sm">No matching research found.</div>
      ) : (
        <div className="panel divide-y divide-paper-border dark:divide-ink-border overflow-hidden">
          {items.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              <Link to={`/report/${r.id}`} className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.topic}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {new Date(r.created_at).toLocaleString()}
                  {r.rating ? ` · ${"★".repeat(r.rating)}` : ""}
                </p>
              </Link>
              <StatusBadge status={r.status} />
              <button
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
                className="text-xs font-mono text-signal-danger hover:underline disabled:opacity-50"
              >
                {deletingId === r.id ? "…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm font-mono text-slate-500">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </AppShell>
  );
}
