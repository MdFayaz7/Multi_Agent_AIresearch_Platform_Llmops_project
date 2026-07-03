import React, { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { changePassword, updateProfile } from "../api/client";

export default function Profile() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ full_name: user?.full_name || "", username: user?.username || "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { data } = await updateProfile(form);
      setUser(data);
      setMessage("Profile updated.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");
    setPwSaving(true);
    try {
      await changePassword(pwForm);
      setPwMessage("Password changed.");
      setPwForm({ current_password: "", new_password: "" });
    } catch (err) {
      setPwError(err.response?.data?.detail || "Could not change password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <AppShell>
      <p className="font-mono text-xs tracking-widest text-signal-amber mb-2">ACCOUNT</p>
      <h1 className="font-display font-semibold text-2xl mb-8">Profile & Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <h2 className="font-display font-semibold text-sm mb-4">Profile information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input opacity-60" value={user?.email} disabled />
            </div>
            {message && <p className="text-xs font-mono text-signal-success">{message}</p>}
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="font-display font-semibold text-sm mb-4">Appearance</h2>
            <p className="text-sm text-slate-500 mb-4">Choose how Nexus looks on this device.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  theme === "light"
                    ? "border-signal-amber text-signal-amber bg-signal-amber/10"
                    : "border-paper-border dark:border-ink-border"
                }`}
              >
                ☀ Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  theme === "dark"
                    ? "border-signal-amber text-signal-amber bg-signal-amber/10"
                    : "border-paper-border dark:border-ink-border"
                }`}
              >
                ☾ Dark
              </button>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-display font-semibold text-sm mb-4">Change password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <input
                  type="password"
                  required
                  className="input"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="input"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                />
              </div>
              {pwError && <p className="text-xs font-mono text-signal-danger">{pwError}</p>}
              {pwMessage && <p className="text-xs font-mono text-signal-success">{pwMessage}</p>}
              <button type="submit" disabled={pwSaving} className="btn-primary">
                {pwSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
