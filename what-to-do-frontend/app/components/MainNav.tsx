"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./MainNav.module.css";

function BurgerIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M4 7h16M4 12h16M4 17h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M6 6l12 12M18 6 6 18"
      />
    </svg>
  );
}

export default function MainNav() {
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    closeMenu();
    logout();
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.brandName}>What To Do</span>
        </Link>

        <div className={styles.mobileControls}>
          {!isLoading && isLoggedIn && user && (
            <span className={styles.mobileUserId} title="User">
              {user.username ?? user.id}
            </span>
          )}
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>
        </div>

        <nav
          id="main-nav"
          className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
        >
          <Link href="/" className={styles.link} onClick={closeMenu}>
            Home
          </Link>
          <Link href="/itinerary" className={styles.link} onClick={closeMenu}>
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
                  onClick={handleLogout}
                  className={styles.linkButton}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.link} onClick={closeMenu}>
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
