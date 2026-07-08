"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./page.module.css";
import { useAuth } from "./contexts/AuthContext";
import LocationAutocomplete from "./components/LocationAutocomplete";
import InterestPicker from "./components/InterestPicker";
import { formatPlace, pickMatch, searchPlaces } from "./lib/geocoding";
import { API_BASE_URL } from "./lib/api";

const ITINERARY_STORAGE_KEY = "planner_home_itinerary";

const MIN_BUDGET = 0;
const MAX_BUDGET = 10000;
const BUDGET_MAX_CENTS = MAX_BUDGET * 100;

const features = [
  "Smart recommendations",
  "Event discovery",
  "Generated itineraries",
  "Calendar export",
];

type PlannerFormData = {
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  budget: string;
  preference: string;
  interests: string[];
};

type PlannerRequestPayload = {
  city: string;
  interests: string;
  budget: number;
  dateRange: string;
  dayStartTime: string;
  dayEndTime: string;
};

type RecommendationApiItem = {
  name: string;
  description: string;
  location: string;
  category: string;
  estimated_cost: number;
  duration_minutes: number;
  indoor: boolean;
  tags: string[];
  source: string;
  event_url: string;
  start_time: string;
  start_time_as_ampm: string;
  end_time: string;
  end_time_as_ampm: string;
  verified: boolean;
};

type ItineraryActivity = {
  id: string;
  time: string;
  location: string;
  activity: string;
  activityType: string;
  price: number | null;
  info: string;
  website?: string;
};

type ItineraryResponse = {
  title: string;
  date: string;
  city: string;
  summary: string;
  activities: ItineraryActivity[];
};

type SavedEventResponse = {
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

type PersistedHomeState = {
  formData: PlannerFormData;
  result: ItineraryResponse | null;
  savedActivityIds: string[];
  savedRecordIds: Record<string, number>;
  locationValid?: boolean;
};

const initialFormData: PlannerFormData = {
  location: "",
  date: "",
  startTime: "09:00",
  endTime: "18:00",
  budget: "",
  preference: "Mixed",
  interests: [],
};

function getAuthHeaders(token: string | null): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatUSDWhole(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function buildRecommendationPayload(
  formData: PlannerFormData,
): PlannerRequestPayload {
  return {
    city: formData.location.trim(),
    interests: formData.interests.join(", "),
    budget: formData.budget === "" ? 0 : Number(formData.budget),
    dateRange: formData.date,
    dayStartTime: formData.startTime,
    dayEndTime: formData.endTime,
  };
}

function normalizeRecommendations(
  items: RecommendationApiItem[],
): ItineraryActivity[] {
  return items.map((item, index) => ({
    id: `${item.name}-${item.start_time}-${index}`,
    time: item.start_time_as_ampm || item.start_time || "TBD",
    location: item.location,
    activity: item.name,
    activityType: item.category,
    price: typeof item.estimated_cost === "number" ? item.estimated_cost : null,
    info: item.description,
    website: item.event_url || undefined,
  }));
}

function buildResult(
  payload: PlannerRequestPayload,
  activities: ItineraryActivity[],
): ItineraryResponse {
  return {
    title: `Plan for ${payload.city || "Your Day"}`,
    date: payload.dateRange,
    city: payload.city || "Selected city",
    summary: "A personalized itinerary generated from your preferences.",
    activities,
  };
}

function ClockIcon() {
  return (
    <svg
      className={styles.timeIcon}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className={styles.selectIcon}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m6 9 6 6 6-6"
      />
    </svg>
  );
}

export default function HomePage() {
  const { isLoggedIn, isLoading, token } = useAuth();

  const [formData, setFormData] = useState<PlannerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [savedActivityIds, setSavedActivityIds] = useState<string[]>([]);
  const [savedRecordIds, setSavedRecordIds] = useState<Record<string, number>>(
    {},
  );
  const [hasHydrated, setHasHydrated] = useState(false);
  const [locationValid, setLocationValid] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [timeError, setTimeError] = useState("");
  const [budgetCapped, setBudgetCapped] = useState(false);
  const budgetFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultSectionRef = useRef<HTMLElement | null>(null);
  const shouldScrollToResultRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ITINERARY_STORAGE_KEY);

      if (!raw) {
        setHasHydrated(true);
        return;
      }

      const parsed: PersistedHomeState = JSON.parse(raw);

      const restoredFormData = { ...initialFormData, ...(parsed.formData ?? {}) };

      if (!Array.isArray(restoredFormData.interests)) {
        const legacy = restoredFormData.interests as unknown as string;
        restoredFormData.interests = legacy
          ? legacy
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
      }

      setFormData(restoredFormData);
      setResult(parsed.result ?? null);
      setSavedActivityIds(parsed.savedActivityIds ?? []);
      setSavedRecordIds(parsed.savedRecordIds ?? {});
      setLocationValid(
        parsed.locationValid ?? Boolean(restoredFormData.location.trim()),
      );
    } catch (error) {
      console.error("Failed to restore itinerary from sessionStorage:", error);
      sessionStorage.removeItem(ITINERARY_STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    const data: PersistedHomeState = {
      formData,
      result,
      savedActivityIds,
      savedRecordIds,
      locationValid,
    };

    sessionStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(data));
  }, [
    hasHydrated,
    formData,
    result,
    savedActivityIds,
    savedRecordIds,
    locationValid,
  ]);

  useEffect(() => {
    return () => {
      if (budgetFlashRef.current) {
        clearTimeout(budgetFlashRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!result || !shouldScrollToResultRef.current) {
      return;
    }

    shouldScrollToResultRef.current = false;
    resultSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [result]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function flashBudgetCap() {
    setBudgetCapped(true);
    if (budgetFlashRef.current) {
      clearTimeout(budgetFlashRef.current);
    }
    budgetFlashRef.current = setTimeout(() => setBudgetCapped(false), 700);
  }

  function handleBudgetChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");

    if (digits === "") {
      setFormData((prev) => ({ ...prev, budget: "" }));
      return;
    }

    let cents = parseInt(digits, 10);

    if (cents > BUDGET_MAX_CENTS) {
      cents = BUDGET_MAX_CENTS;
      flashBudgetCap();
    }

    setFormData((prev) => ({ ...prev, budget: (cents / 100).toFixed(2) }));
  }

  function setInterests(next: string[]) {
    setFormData((prev) => ({ ...prev, interests: next }));
  }

  function formatPrice(price: number | null) {
    if (price === null) return "N/A";
    if (price === 0) return "Free";
    return `$${price}`;
  }

  async function resolveLocation(): Promise<string | null> {
    const typed = formData.location.trim();

    if (!typed) {
      setLocationError("Please enter a location.");
      return null;
    }

    if (locationValid) {
      return typed;
    }

    setIsValidatingLocation(true);

    try {
      const results = await searchPlaces(typed);
      const match = pickMatch(results, typed);

      if (!match) {
        setLocationError(
          "That location doesn't seem to exist. Pick one from the suggestions.",
        );
        return null;
      }

      const label = formatPlace(match);
      setFormData((prev) => ({ ...prev, location: label }));
      setLocationValid(true);
      return label;
    } catch (error) {
      console.error("Location validation error:", error);
      setLocationError("Couldn't verify that location. Please try again.");
      return null;
    } finally {
      setIsValidatingLocation(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      formData.startTime &&
      formData.endTime &&
      formData.endTime <= formData.startTime
    ) {
      setTimeError("End time must be after the start time.");
      return;
    }

    setTimeError("");
    setLocationError("");

    const resolvedLocation = await resolveLocation();

    if (!resolvedLocation) {
      return;
    }

    setIsSubmitting(true);

    const payload = buildRecommendationPayload({
      ...formData,
      location: resolvedLocation,
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/events/recommendations?provider=openai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            city: payload.city,
            interests: payload.interests,
            budget: payload.budget,
            date_range: payload.dateRange,
            day_start_time: payload.dayStartTime,
            day_end_time: payload.dayEndTime,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate itinerary");
      }

      const data: RecommendationApiItem[] = await response.json();
      const activities = normalizeRecommendations(data);

      shouldScrollToResultRef.current = true;
      setResult(buildResult(payload, activities));
      setSavedActivityIds([]);
      setSavedRecordIds({});
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong while generating the itinerary.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleSave(activity: ItineraryActivity) {
    if (isLoading) {
      return;
    }

    if (!isLoggedIn) {
      alert("Please log in to save activities.");
      return;
    }

    const isSaved = savedActivityIds.includes(activity.id);

    if (isSaved) {
      const savedRecordId = savedRecordIds[activity.id];

      if (!savedRecordId) {
        alert("Could not find the saved record id.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/saved/${savedRecordId}`, {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(token),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete saved event");
        }

        setSavedActivityIds((prev) =>
          prev.filter((savedId) => savedId !== activity.id),
        );

        setSavedRecordIds((prev) => {
          const next = { ...prev };
          delete next[activity.id];
          return next;
        });
      } catch (error) {
        console.error("Delete save error:", error);
        alert("Something went wrong while removing the saved activity.");
      }

      return;
    }

    const savePayload = {
      title: activity.activity,
      date: result?.date ?? "",
      time: activity.time,
      location: activity.location,
      tag: activity.activityType,
      price:
        activity.price === null
          ? "N/A"
          : activity.price === 0
            ? "Free"
            : String(activity.price),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/saved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(savePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to save activity");
      }

      const savedData: SavedEventResponse = await response.json();

      setSavedActivityIds((prev) => [...prev, activity.id]);
      setSavedRecordIds((prev) => ({
        ...prev,
        [activity.id]: savedData.id,
      }));
    } catch (error) {
      console.error("Save error:", error);
      alert("Something went wrong while saving the activity.");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>AI Activity Planner</div>

          <h1 className={styles.title}>
            Plan your free time with less effort.
          </h1>

          <p className={styles.subtitle}>
            Discover activities and generate a clean itinerary based on your
            preferences.
          </p>

          <div className={styles.featureList}>
            {features.map((feature) => (
              <span key={feature} className={styles.featurePill}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.formEyebrow}>Start Planning</p>
            <h2>Create Your Plan</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="location">Location</label>
              <LocationAutocomplete
                id="location"
                name="location"
                placeholder="Enter a city (e.g. San Francisco)"
                value={formData.location}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, location: value }));
                  setLocationError("");
                }}
                onValidChange={setLocationValid}
              />
              {locationError ? (
                <p className={styles.fieldError}>{locationError}</p>
              ) : (
                locationValid &&
                formData.location.trim() !== "" && (
                  <p className={styles.fieldHint}>✓ Verified location</p>
                )
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.twoColumn}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="startTime">Start time</label>
                  <div className={styles.timeField}>
                    <input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                    <ClockIcon />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="endTime">End time</label>
                  <div className={styles.timeField}>
                    <input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                    <ClockIcon />
                  </div>
                </div>
              </div>
              {timeError && <p className={styles.fieldError}>{timeError}</p>}
            </div>

            <div className={styles.twoColumn}>
              <div className={styles.fieldGroup}>
                <label htmlFor="budget">
                  Budget
                  <span
                    className={
                      budgetCapped
                        ? `${styles.labelHint} ${styles.labelHintInvalid}`
                        : styles.labelHint
                    }
                  >
                    Between {formatUSDWhole(MIN_BUDGET)}–
                    {formatUSDWhole(MAX_BUDGET)}
                  </span>
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="text"
                  inputMode="numeric"
                  placeholder={formatUSD(0)}
                  className={budgetCapped ? styles.inputInvalid : undefined}
                  value={
                    formData.budget === ""
                      ? ""
                      : formatUSD(Number(formData.budget))
                  }
                  onChange={handleBudgetChange}
                  aria-invalid={budgetCapped}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="preference">Preference</label>
                <div className={styles.selectField}>
                  <select
                    id="preference"
                    name="preference"
                    value={formData.preference}
                    onChange={handleChange}
                  >
                    <option>Indoor</option>
                    <option>Outdoor</option>
                    <option>Mixed</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="interests">Interests</label>
              <InterestPicker
                id="interests"
                value={formData.interests}
                placeholder="Type to search — e.g. food, art, live music"
                onChange={setInterests}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting || isValidatingLocation}
              >
                {isValidatingLocation
                  ? "Checking location..."
                  : isSubmitting
                    ? "Preparing..."
                    : "Generate Itinerary"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {result && (
        <section className={styles.resultSection} ref={resultSectionRef}>
          <div className={styles.resultHeader}>
            <p className={styles.formEyebrow}>Generated Itinerary</p>
            <h2 className={styles.resultTitle}>{result.title}</h2>
            <p className={styles.resultSubtitle}>{result.summary}</p>
          </div>

          <div className={styles.resultMeta}>
            <span className={styles.metaPill}>{result.date || "No date"}</span>
            <span className={styles.metaPill}>{result.city || "No city"}</span>
            <span className={styles.metaPill}>
              {result.activities.length} activities
            </span>
          </div>

          <div className={styles.resultList}>
            {result.activities.map((activity) => {
              const isSaved = savedActivityIds.includes(activity.id);

              return (
                <article key={activity.id} className={styles.resultCard}>
                  <div className={styles.resultTime}>{activity.time}</div>

                  <div className={styles.resultContent}>
                    <div className={styles.resultTopRow}>
                      <div>
                        <h3>{activity.activity}</h3>
                        <p className={styles.resultCategory}>
                          {activity.activityType}
                        </p>
                      </div>

                      <div className={styles.resultRight}>
                        <span className={styles.resultCost}>
                          {formatPrice(activity.price)}
                        </span>

                        <button
                          type="button"
                          className={
                            isSaved ? styles.savedButton : styles.saveButton
                          }
                          onClick={() => handleToggleSave(activity)}
                        >
                          {!isLoggedIn
                            ? "Log in to save"
                            : isSaved
                              ? "Remove"
                              : "Save"}
                        </button>
                      </div>
                    </div>

                    <p className={styles.resultAddress}>
                      <span>Location:</span> {activity.location}
                    </p>

                    <p className={styles.resultDescription}>{activity.info}</p>

                    {activity.website && (
                      <a
                        href={activity.website}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.websiteLink}
                      >
                        Visit website
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
