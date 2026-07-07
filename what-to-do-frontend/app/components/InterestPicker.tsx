import { useEffect, useRef, useState } from "react";
import { primeInterests, suggestInterests } from "../lib/interestTrie";
import { API_BASE_URL } from "../lib/api";
import styles from "./InterestPicker.module.css";

type InterestPickerProps = {
  id: string;
  value: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
};

export default function InterestPicker({
  id,
  value,
  placeholder,
  onChange,
}: InterestPickerProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [duplicate, setDuplicate] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/interests`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((list: string[]) => {
        if (active) {
          primeInterests(list);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  function alreadyAdded(candidate: string): boolean {
    const lower = candidate.trim().toLowerCase();
    return value.some((item) => item.toLowerCase() === lower);
  }

  useEffect(() => {
    const query = input.trim();

    if (!query) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      const matches = await suggestInterests(query, 8);

      if (current !== requestId.current) {
        return;
      }

      const available = matches.filter((match) => !alreadyAdded(match));
      setSuggestions(available);
      setOpen(available.length > 0);
      setActiveIndex(-1);
    }, 150);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addInterest(rawName: string) {
    const name = rawName.trim();

    if (!name) {
      return;
    }

    if (alreadyAdded(name)) {
      setDuplicate(`"${name}" is already on your list.`);
      return;
    }

    onChange([...value, name]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setDuplicate("");
  }

  function removeInterest(name: string) {
    onChange(value.filter((item) => item !== name));
    setDuplicate("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeIndex >= 0) {
        addInterest(suggestions[activeIndex]);
      } else {
        addInterest(input);
      }
    } else if (event.key === "Backspace" && !input && value.length > 0) {
      removeInterest(value[value.length - 1]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.control}>
        {value.map((item) => (
          <span key={item} className={styles.chip}>
            {item}
            <button
              type="button"
              className={styles.chipRemove}
              aria-label={`Remove ${item}`}
              onClick={() => removeInterest(item)}
            >
              ×
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          autoComplete="off"
          className={styles.input}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          value={input}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          onChange={(event) => {
            setInput(event.target.value);
            setDuplicate("");
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul id={`${id}-listbox`} className={styles.dropdown} role="listbox">
          {suggestions.map((match, index) => (
            <li
              key={match}
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
                addInterest(match);
              }}
            >
              {match}
            </li>
          ))}
        </ul>
      )}

      {duplicate && <p className={styles.duplicate}>{duplicate}</p>}
    </div>
  );
}
