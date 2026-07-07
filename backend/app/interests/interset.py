"""Loads the interest vocabulary served to the planner form."""
import csv
from functools import lru_cache
from pathlib import Path

_CSV_PATH = Path(__file__).parent / "hobbies.csv"


@lru_cache(maxsize=50)
def load_interests() -> list[str]:
    """Return the de-duplicated, alphabetically sorted interest vocabulary."""
    with _CSV_PATH.open(newline="", encoding="utf-8") as handle:
        rows = [row[0].strip() for row in csv.reader(handle) if row and row[0].strip()]

    if rows and rows[0].lower() == "hobby":
        rows = rows[1:]

    seen: set[str] = set()
    interests: list[str] = []
    for item in rows:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            interests.append(item)

    return sorted(interests, key=str.lower)
