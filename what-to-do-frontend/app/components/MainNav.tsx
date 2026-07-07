"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import styles from "./MainNav.module.css";

export default function MainNav() {
  const { isLoggedIn, isLoading, user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.brandName}>What To Do</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.link}>
            Home
          </Link>
          <Link href="/itinerary" className={styles.link}>
            Itinerary
          </Link>
          {!isLoading && (
            isLoggedIn && user ? (
              <>
                <span className={styles.userId} title="User">
                  {user.username ?? user.id}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className={styles.linkButton}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.link}>
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
