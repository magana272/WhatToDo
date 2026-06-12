"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://mk2tba6npp.us-east-1.awsapprunner.com";
const ITINERARY_STORAGE_KEY = "planner_home_itinerary";

type HistoryItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  summary: string;
  preference: "Indoor" | "Outdoor" | "Mixed";
  time?: string;
};

type SavedEventApiItem = {
  id: number;
  user_id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  price: string;
  saved_at: string;
};

function getAuthHeaders(token: string | null): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function mapTagToPreference(tag: string): "Indoor" | "Outdoor" | "Mixed" {
  const normalized = tag.toLowerCase();

  if (normalized.includes("indoor")) {
    return "Indoor";
  }

  if (normalized.includes("outdoor")) {
    return "Outdoor";
  }

  return "Mixed";
}

function removeDeletedItemFromHomeCache(deletedItemId: string) {
  try {
    const raw = sessionStorage.getItem(ITINERARY_STORAGE_KEY);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);

    const nextSavedRecordIds = { ...(parsed.savedRecordIds ?? {}) };

    Object.keys(nextSavedRecordIds).forEach((activityId) => {
      if (String(nextSavedRecordIds[activityId]) === deletedItemId) {
        delete nextSavedRecordIds[activityId];
      }
    });

    const nextSavedActivityIds = (parsed.savedActivityIds ?? []).filter(
      (activityId: string) => nextSavedRecordIds[activityId] !== undefined,
    );

    sessionStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        savedActivityIds: nextSavedActivityIds,
        savedRecordIds: nextSavedRecordIds,
      }),
    );
  } catch (error) {
    console.error("Failed to sync home page cache:", error);
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseTimeTo24Hour(time?: string) {
  if (!time || !time.trim()) {
    return { hour: 9, minute: 0 };
  }

  const raw = time.trim().toLowerCase();

  const ampmMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2] ?? "0");
    const meridiem = ampmMatch[3].toLowerCase();

    if (meridiem === "pm" && hour !== 12) {
      hour += 12;
    }

    if (meridiem === "am" && hour === 12) {
      hour = 0;
    }

    return { hour, minute };
  }

  const twentyFourHourMatch = raw.match(/(\d{1,2}):(\d{2})/);
  if (twentyFourHourMatch) {
    return {
      hour: Number(twentyFourHourMatch[1]),
      minute: Number(twentyFourHourMatch[2]),
    };
  }

  const hourOnlyMatch = raw.match(/\b(\d{1,2})\b/);
  if (hourOnlyMatch) {
    return {
      hour: Number(hourOnlyMatch[1]),
      minute: 0,
    };
  }

  // Fallback
  return { hour: 9, minute: 0 };
}

function createLocalDate(date: string, time?: string) {
  const parts = date.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid date: ${date}`);
  }

  const [year, month, day] = parts;
  const { hour, minute } = parseTimeTo24Hour(time);

  return new Date(year, month - 1, day, hour, minute, 0);
}

function toICSDateTime(date: Date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function escapeICS(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function downloadICS(item: HistoryItem) {
  try {
    const startDate = createLocalDate(item.date, item.time);

    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Invalid start date");
    }

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    const uid = `saved-${item.id}@planner`;
    const dtstamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "Z");

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "PRODID:-//Planner App//Saved Itinerary//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toICSDateTime(startDate)}`,
      `DTEND:${toICSDateTime(endDate)}`,
      `SUMMARY:${escapeICS(item.title)}`,
      `LOCATION:${escapeICS(item.location)}`,
      `DESCRIPTION:${escapeICS(`${item.title} at ${item.location}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });

    const safeFileName = item.title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${safeFileName || "event"}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Failed to generate ICS:", error);
    alert("This event has an invalid date or time format.");
  }
}

export default function ItineraryPage() {
  const { isLoggedIn, isLoading, token } = useAuth();

  const [search, setSearch] = useState("");
  const [preferenceFilter, setPreferenceFilter] = useState("All");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadItineraries() {
      if (!isLoggedIn || !token) {
        setItems([]);
        return;
      }

      setIsFetching(true);

      try {
        const response = await fetch(`${API_BASE_URL}/saved`, {
          method: "GET",
          headers: {
            ...getAuthHeaders(token),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch saved itineraries");
        }

        const data: SavedEventApiItem[] = await response.json();

        const mappedItems: HistoryItem[] = data.map((item) => ({
          id: String(item.id),
          title: item.title,
          date: item.date,
          location: item.location,
          summary: `${item.time} • ${item.tag} • ${item.price}`,
          preference: mapTagToPreference(item.tag),
          time: item.time,
        }));

        setItems(mappedItems);
      } catch (error) {
        console.error("Failed to load itineraries:", error);
        setItems([]);
      } finally {
        setIsFetching(false);
      }
    }

    if (!isLoading) {
      loadItineraries();
    }
  }, [isLoggedIn, isLoading, token]);

  async function handleDeleteItinerary(itemId: string) {
    if (!token) {
      alert("Please log in to delete saved plans.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this saved itinerary?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingId(itemId);

    try {
      const response = await fetch(`${API_BASE_URL}/saved/${itemId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(token),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete saved itinerary");
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      removeDeletedItemFromHomeCache(itemId);
    } catch (error) {
      console.error("Failed to delete itinerary:", error);
      alert("Something went wrong while deleting the itinerary.");
    } finally {
      setIsDeletingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query);

      const matchesPreference =
        preferenceFilter === "All" || item.preference === preferenceFilter;

      return matchesSearch && matchesPreference;
    });
  }, [items, search, preferenceFilter]);

  return (
    <main className={styles.page}>
      <section className={styles.headerSection}>
        <p className={styles.eyebrow}>Itinerary History</p>
        <h1 className={styles.title}>Your saved plans</h1>
        <p className={styles.subtitle}>
          Browse previously generated itineraries and filter them by keyword or
          preference.
        </p>
      </section>

      <section className={styles.contentGrid}>
        <aside className={styles.filterCard}>
          <h2 className={styles.filterTitle}>Filters</h2>

          <div className={styles.fieldGroup}>
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search by title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="preference">Preference</label>
            <select
              id="preference"
              value={preferenceFilter}
              onChange={(event) => setPreferenceFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <button
            type="button"
            className={styles.resetButton}
            onClick={() => {
              setSearch("");
              setPreferenceFilter("All");
            }}
          >
            Reset Filters
          </button>
        </aside>

        <section className={styles.listSection}>
          <div className={styles.resultsHeader}>
            <h2>Results</h2>
            <span className={styles.resultsCount}>
              {filteredItems.length} plan{filteredItems.length === 1 ? "" : "s"}
            </span>
          </div>

          {!isLoggedIn ? (
            <div className={styles.emptyState}>
              <h3>No saved itineraries</h3>
              <p>Please log in to view your saved plans.</p>
            </div>
          ) : isLoading || isFetching ? (
            <div className={styles.emptyState}>
              <h3>Loading itineraries</h3>
              <p>Please wait while your saved plans are loading.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No itineraries found</h3>
              <p>Try changing your filters or search terms.</p>
            </div>
          ) : (
            <div className={styles.cardList}>
              {filteredItems.map((item) => {
                const isDeleting = isDeletingId === item.id;

                return (
                  <article key={item.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div>
                        <h3>{item.title}</h3>
                        <p className={styles.summary}>{item.summary}</p>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.downloadButton}
                          onClick={() => downloadICS(item)}
                        >
                          Download ICS
                        </button>

                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDeleteItinerary(item.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.metaRow}>
                      <span className={styles.metaPill}>{item.date}</span>
                      <span className={styles.metaPill}>{item.location}</span>
                      <span className={styles.metaPill}>{item.preference}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}