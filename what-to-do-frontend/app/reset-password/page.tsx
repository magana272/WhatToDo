"use client";

import { useState, Suspense } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "../lib/api";
import styles from "./page.module.css";

const RESET_PASSWORD_ENDPOINT = `${API_BASE_URL}/auth/reset-password`;
const FETCH_TIMEOUT_MS = 12_000;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    if (name === "password") setPassword(value);
    if (name === "confirmPassword") setConfirmPassword(value);
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
    setSuccessMessage(null);

    const nextFieldErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};
    if (!password) nextFieldErrors.password = "Cannot be empty.";
    else if (password.length < 8)
      nextFieldErrors.password = "Must be at least 8 characters.";
    if (!confirmPassword)
      nextFieldErrors.confirmPassword = "Cannot be empty.";
    else if (password !== confirmPassword)
      nextFieldErrors.confirmPassword = "Passwords do not match.";
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(RESET_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Something went wrong. Please try again.";
        setErrorMessage(message);
        return;
      }

      setSuccessMessage("Your password has been reset successfully.");
    } catch (error) {
      console.error("Reset password request failed:", error);
      setErrorMessage("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.formCard}>
        <div className={styles.errorMessage} role="alert">
          Invalid or missing reset link. Please request a new one.
        </div>
        <p className={styles.signupHint}>
          <Link href="/forgot-password" className={styles.signupLink}>
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <p className={styles.formEyebrow}>Account recovery</p>
        <h2>Set new password</h2>
      </div>

      {successMessage ? (
        <div className={styles.successMessage} role="status">
          {successMessage}
          <p className={styles.backToLogin}>
            <Link href="/login" className={styles.signupLink}>
              Sign in with your new password
            </Link>
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {errorMessage && (
            <div className={styles.errorMessage} role="alert">
              {errorMessage}
            </div>
          )}
          <div
            className={`${styles.fieldGroup} ${fieldErrors.password ? styles.fieldGroupError : ""}`}
          >
            <label htmlFor="password">
              New password <span className={styles.required}>*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
          <div
            className={`${styles.fieldGroup} ${fieldErrors.confirmPassword ? styles.fieldGroupError : ""}`}
          >
            <label htmlFor="confirmPassword">
              Confirm password <span className={styles.required}>*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "confirmPassword-error"
                  : undefined
              }
            />
            {fieldErrors.confirmPassword && (
              <span
                id="confirmPassword-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </div>
        </form>
      )}

      <p className={styles.signupHint}>
        Remember your password?{" "}
        <Link href="/login" className={styles.signupLink}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>What To Do</div>
          <h1 className={styles.title}>Create a new password.</h1>
          <p className={styles.subtitle}>
            Choose a strong password to keep your account secure.
          </p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}