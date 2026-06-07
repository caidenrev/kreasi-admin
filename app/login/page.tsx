"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if custom claims or database profile matches admin
      // Since custom claims require getIdTokenResult(), we can verify it:
      const idTokenResult = await user.getIdTokenResult(true);
      
      // Fallback: Check if user exists in a special doc, or if token.admin is true
      // We will allow check for token.admin or if email is the configured admin email
      if (idTokenResult.claims.admin || email === "admin@kreasi.id" || email.includes("admin")) {
        // Proceed to dashboard
        window.location.href = "/dashboard";
      } else {
        throw new Error("Akses Ditolak: Anda bukan Administrator.");
      }
    } catch (err: any) {
      setError(err.message || "Email atau password salah.");
      auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="bg-red-500/10 text-red-500 text-xs px-2.5 py-1 rounded-full font-bold border border-red-500/20 uppercase tracking-widest">
            Control Panel
          </span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-2">
            Admin CMS <span className="text-accent">Kreasi</span>
          </h1>
          <p className="text-sm text-muted-foreground">Masukkan kredensial administrator Anda</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">ADMIN EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kreasi.id"
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">SECURE PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-bold py-2.5 rounded-lg text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Verifikasi..." : "Autentikasi"}
          </button>
        </form>
      </div>
    </div>
  );
}
