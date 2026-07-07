import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { listResearch, getTokenStats, getCostStats } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [tokenStats, setTokenStats] = useState({ input_tokens: 0, output_tokens: 0, total_tokens: 0 });
  const [costStats, setCostStats] = useState({ today_cost: 0, month_cost: 0, average_cost: 0 });
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

        const tokenRes = await getTokenStats();
        setTokenStats(tokenRes.data);

        const costRes = await getCostStats();
        setCostStats(costRes.data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
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

      <div className="panel p-6 mb-8 border border-slate-800 bg-slate-900/50">
        <h2 className="font-display font-semibold text-sm tracking-wide mb-4">Today's Token Usage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">Input Tokens</p>
            <p className="font-display font-bold text-2xl text-slate-200">
              {tokenStats.input_tokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">Output Tokens</p>
            <p className="font-display font-bold text-2xl text-slate-200">
              {tokenStats.output_tokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">Total Tokens</p>
            <p className="font-display font-bold text-2xl text-signal-amber">
              {tokenStats.total_tokens.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-6 mb-8 border border-slate-800 bg-slate-900/50">
        <h2 className="font-display font-semibold text-sm tracking-wide mb-4">Cost Monitoring</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">Today's Cost</p>
            <p className="font-display font-bold text-2xl text-slate-200">
              ${costStats.today_cost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">This Month</p>
            <p className="font-display font-bold text-2xl text-slate-200">
              ${costStats.month_cost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">Average Cost per Report</p>
            <p className="font-display font-bold text-2xl text-signal-success">
              ${costStats.average_cost.toFixed(2)}
            </p>
          </div>
        </div>
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
