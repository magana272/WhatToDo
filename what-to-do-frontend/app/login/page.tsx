"use client";

import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../lib/api";
import styles from "./page.module.css";

const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;
const FETCH_TIMEOUT_MS = 12_000;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    if (name === "username") setUsername(value);
    if (name === "password") setPassword(value);
    setErrorMessage(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (name in next) delete next[name as keyof typeof next];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const nextFieldErrors: { username?: string; password?: string } = {};
    if (!username.trim()) nextFieldErrors.username = "Cannot be empty.";
    if (!password) nextFieldErrors.password = "Cannot be empty.";
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      username: username.trim(),
      password,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
              ? (data.detail[0]?.msg ?? "Invalid credentials")
              : "Invalid credentials. Please try again.";
        setErrorMessage(message);
        return;
      }
      if (!data.access_token || !data.user) {
        setErrorMessage("Unexpected response from server.");
        return;
      }
      setAuth({
        user: {
          id: String(data.user.id),
          username: data.user.username,
          email: data.user.email,
        },
        token: data.access_token,
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login request failed:", error);
      setErrorMessage("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>What To Do</div>
          <h1 className={styles.title}>Sign in to plan your free time.</h1>
          <p className={styles.subtitle}>
            Use your account to save itineraries and sync across devices.
          </p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.formEyebrow}>Welcome back</p>
            <h2>Sign in</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {errorMessage && (
              <div className={styles.errorMessage} role="alert">
                {errorMessage}
              </div>
            )}
            <div
              className={`${styles.fieldGroup} ${fieldErrors.username ? styles.fieldGroupError : ""}`}
            >
              <label htmlFor="username">
                Username or email <span className={styles.required}>*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter username or email"
                autoComplete="username"
                value={username}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.username}
                aria-describedby={
                  fieldErrors.username ? "username-error" : undefined
                }
              />
              {fieldErrors.username && (
                <span
                  id="username-error"
                  className={styles.fieldError}
                  role="alert"
                >
                  {fieldErrors.username}
                </span>
              )}
            </div>
            <div
              className={`${styles.fieldGroup} ${fieldErrors.password ? styles.fieldGroupError : ""}`}
            >
              <label htmlFor="password">
                Password <span className={styles.required}>*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
                value={password}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
              />
              {fieldErrors.password && (
                <span
                  id="password-error"
                  className={styles.fieldError}
                  role="alert"
                >
                  {fieldErrors.password}
                </span>
              )}
            </div>
            <div className={styles.forgotPassword}>
              <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                Forgot password?
              </Link>
            </div>
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className={styles.divider}>
            <span>or continue with</span>
          </div>
          {/*
          <div className={styles.socialButtons}>
            <button type="button" className={styles.socialButton} aria-label="Sign in with Google">
              <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
                {/* Google G */}
          {/* <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button type="button" className={styles.socialButton} aria-label="Sign in with GitHub">
              <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
            <button type="button" className={styles.socialButton} aria-label="Sign in with Apple">
              <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13 1.18.61 2.03 1.44 2.9 2.39.24.26.46.54.7.79-.14.07-.27.15-.42.2-1.02.37-2.05.73-3.07 1.09-.27.1-.54.19-.82.27-.12.03-.23.07-.35.09-.08.01-.15.03-.23.04zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div> */}

          <p className={styles.signupHint}>
            Don’t have an account?{" "}
            <Link href="/signup" className={styles.signupLink}>
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
