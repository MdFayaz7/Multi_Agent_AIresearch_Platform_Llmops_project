import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-signal-amber flex items-center justify-center font-display font-bold text-ink">
            N
          </div>
          <div className="text-left">
            <p className="font-display font-semibold leading-none">Nexus</p>
            <p className="text-[10px] font-mono text-slate-500 tracking-widest">RESEARCH LAB</p>
          </div>
        </div>

        <div className="panel p-6">
          <h1 className="font-display font-semibold text-lg mb-1">Create your workspace</h1>
          <p className="text-sm text-slate-500 mb-6">Set up an account to start researching.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.full_name} onChange={update("full_name")} placeholder="Ada Lovelace" />
            </div>
            <div>
              <label className="label">Username</label>
              <input required className="input" value={form.username} onChange={update("username")} placeholder="ada" />
            </div>
            <div>
              <label className="label">Email</label>
              <input required type="email" className="input" value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" minLength={8} className="input" value={form.password} onChange={update("password")} placeholder="At least 8 characters" />
            </div>
            {error && (
              <p className="text-xs font-mono text-signal-danger bg-signal-danger/10 border border-signal-danger/30 rounded-lg p-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-signal-amber font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
