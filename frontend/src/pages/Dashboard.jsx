import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { listResearch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listResearch({ page: 1, page_size: 6, sort_by: "created_at", sort_dir: "desc" });
        setRecent(data.items);
        const completed = data.items.filter((r) => r.status === "completed").length;
        const inProgress = data.items.filter((r) => !["completed", "failed"].includes(r.status)).length;
        setStats({ total: data.total, completed, inProgress });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <p className="font-mono text-xs tracking-widest text-signal-amber mb-2">DASHBOARD</p>
      <h1 className="font-display font-semibold text-2xl mb-1">
        Welcome back, {user?.full_name || user?.username}
      </h1>
      <p className="text-slate-500 text-sm mb-8">Here's what your agents have been up to.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Reports" value={stats.total} accent="text-signal-cyan" />
        <StatCard label="Completed" value={stats.completed} accent="text-signal-success" />
        <StatCard label="In Progress" value={stats.inProgress} accent="text-signal-amber" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-sm tracking-wide">Recent Research</h2>
        <div className="flex gap-2">
          <Link to="/history" className="text-xs font-mono text-signal-amber">
            View all →
          </Link>
          <Link to="/new" className="btn-primary text-xs px-3 py-1.5">
            + New
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 font-mono">loading…</p>
      ) : recent.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-slate-500 text-sm mb-4">No research yet — start your first run.</p>
          <Link to="/new" className="btn-primary inline-flex">
            Start researching
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recent.map((r) => (
            <Link
              to={`/report/${r.id}`}
              key={r.id}
              className="panel p-4 hover:border-signal-amber/50 transition block"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-display font-medium text-sm line-clamp-2">{r.topic}</p>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="panel p-5">
      <p className="label mb-1">{label}</p>
      <p className={`font-display font-bold text-3xl ${accent}`}>{value}</p>
    </div>
  );
}
