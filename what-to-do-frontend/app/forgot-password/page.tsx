"use client";

import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { API_BASE_URL } from "../lib/api";
import styles from "./page.module.css";

const FORGOT_PASSWORD_ENDPOINT = `${API_BASE_URL}/auth/forgot-password`;
const FETCH_TIMEOUT_MS = 12_000;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    setErrorMessage(null);
    setFieldError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setFieldError("Cannot be empty.");
      return;
    }

    setFieldError(undefined);
    setIsSubmitting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(FORGOT_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
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

      setSuccessMessage(
        "If an account with that email exists, you'll receive password reset instructions shortly."
      );
    } catch (error) {
      console.error("Forgot password request failed:", error);
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
          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.subtitle}>
            No worries. Enter your email and we&apos;ll send you a link to reset
            it.
          </p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.formEyebrow}>Account recovery</p>
            <h2>Reset password</h2>
          </div>

          {successMessage ? (
            <div className={styles.successMessage} role="status">
              {successMessage}
              <p className={styles.backToLogin}>
                <Link href="/login" className={styles.signupLink}>
                  Back to sign in
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
                className={`${styles.fieldGroup} ${fieldError ? styles.fieldGroupError : ""}`}
              >
                <label htmlFor="email">
                  Email address <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? "email-error" : undefined}
                />
                {fieldError && (
                  <span
                    id="email-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldError}
                  </span>
                )}
              </div>
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
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
      </section>
    </main>
  );
}