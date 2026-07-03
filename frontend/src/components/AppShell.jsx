import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◧" },
  { to: "/new", label: "New Research", icon: "＋" },
  { to: "/history", label: "History", icon: "≡" },
  { to: "/profile", label: "Profile", icon: "◍" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-paper dark:bg-ink">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-paper-border dark:border-ink-border hidden md:flex md:flex-col">
        <div className="px-5 py-5 border-b border-paper-border dark:border-ink-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-signal-amber flex items-center justify-center font-display font-bold text-ink">
              N
            </div>
            <div>
              <p className="font-display font-semibold text-sm leading-none">Nexus</p>
              <p className="text-[10px] font-mono text-slate-500 tracking-widest">RESEARCH LAB</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-signal-amber/10 text-signal-amber"
                    : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`
              }
            >
              <span className="font-mono">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-paper-border dark:border-ink-border">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full btn-secondary justify-start"
          >
            ⇥ Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-paper-border dark:border-ink-border flex items-center justify-between px-4 md:px-6">
          <div className="md:hidden font-display font-semibold">Nexus</div>
          <div className="hidden md:block text-sm text-slate-500 font-mono">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full border border-paper-border dark:border-ink-border flex items-center justify-center text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium">{user?.username}</span>
              <span className="text-xs text-slate-500 font-mono">{user?.email}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-signal-cyan/20 text-signal-cyan flex items-center justify-center font-display font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto border-b border-paper-border dark:border-ink-border px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `px-4 py-3 text-sm whitespace-nowrap font-medium ${
                  isActive ? "text-signal-amber border-b-2 border-signal-amber" : "text-slate-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
