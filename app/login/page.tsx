"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { Loader } from "@/components/Loader";

export default function LoginPage() {
  const router = useRouter();
  const { token, loginWithGoogle, loading, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      router.replace("/items");
    }
  }, [loading, router, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      toast.success("Logged in successfully");
      router.push("/items");
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? err.message.replace("Firebase:", "").trim()
          : err instanceof Error
            ? err.message
            : "Unable to log in. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Google login is not available right now.";
      setError(message);
      toast.error(message);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setDemoSubmitting(true);
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: "user1@gmail.com",
          password: "123456789",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Demo login failed");
      }

      const data = await response.json();
      toast.success("Demo login successful");
      
      // Set the session token from response
      if (data.token) {
        await setSession(data.token);
      }
      
      router.push("/items");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Demo login is not available right now.";
      setError(message);
      toast.error(message);
    } finally {
      setDemoSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-base bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader size="lg" variant="spinner" />
          <p className="text-sm text-muted">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-base bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted">Log in to report or track items on campus.</p>
      </div>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-base bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
      >
        {googleSubmitting ? "Connecting..." : "Continue with Google"}
      </button>
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={demoSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
      >
        {demoSubmitting ? "Logging in..." : "Demo Login"}
      </button>
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="h-px flex-1 bg-base" />
        <span>or</span>
        <span className="h-px flex-1 bg-base" />
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-primary">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block text-sm font-semibold text-primary">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
