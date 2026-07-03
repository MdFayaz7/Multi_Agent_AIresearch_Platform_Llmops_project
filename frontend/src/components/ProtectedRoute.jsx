import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-mono text-sm text-slate-500">
        loading session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
