import { useEffect, useRef, useState } from "react";
import { formatPlace, searchPlaces, type GeoPlace } from "../lib/geocoding";
import styles from "./LocationAutocomplete.module.css";

type LocationAutocompleteProps = {
  id: string;
  name: string;
  value: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onValidChange: (valid: boolean) => void;
};

export default function LocationAutocomplete({
  id,
  name,
  value,
  placeholder,
  onValueChange,
  onValidChange,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (!focused) {
      return;
    }

    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const query = value.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const results = await searchPlaces(query, {
          signal: controller.signal,
        });

        setSuggestions(results);
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value, focused]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(place: GeoPlace) {
    skipNextSearch.current = true;
    onValueChange(formatPlace(place));
    onValidChange(true);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        onChange={(event) => {
          onValueChange(event.target.value);
          onValidChange(false);
        }}
        onFocus={() => {
          setFocused(true);
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <ul id={`${id}-listbox`} className={styles.dropdown} role="listbox">
          {loading && suggestions.length === 0 && (
            <li className={styles.status}>Searching…</li>
          )}

          {!loading && suggestions.length === 0 && (
            <li className={styles.status}>No matching places found.</li>
          )}

          {suggestions.map((place, index) => (
            <li
              key={place.id}
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? `${styles.option} ${styles.optionActive}`
                  : styles.option
              }
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelect(place);
              }}
            >
              <span className={styles.optionName}>{place.name}</span>
              <span className={styles.optionMeta}>
                {[place.admin1, place.country].filter(Boolean).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}