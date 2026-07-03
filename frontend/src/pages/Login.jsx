import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink px-4">
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
          <h1 className="font-display font-semibold text-lg mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in to your research workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-xs font-mono text-signal-danger bg-signal-danger/10 border border-signal-danger/30 rounded-lg p-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-signal-amber font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
