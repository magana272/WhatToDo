export const mockUser = {
  id: 1,
  username: "demo_user",
  email: "demo@example.com",
};

export const mockAccessToken = "mock-jwt-token-abc123";

export const mockRecommendations = [
  {
    name: "Morning Yoga in the Park",
    description:
      "Start your day with a relaxing outdoor yoga session led by a certified instructor. All levels welcome, mats provided.",
    location: "Central Park Great Lawn, New York, NY",
    category: "Fitness & Wellness",
    estimated_cost: 15,
    duration_minutes: 60,
    indoor: false,
    tags: ["outdoor", "fitness", "wellness", "morning"],
    source: "claude",
    event_url: "https://example.com/yoga-park",
    start_time: "09:00",
    start_time_as_ampm: "9:00 AM",
    end_time: "10:00",
    end_time_as_ampm: "10:00 AM",
    verified: true,
  },
  {
    name: "Brooklyn Art Museum Visit",
    description:
      "Explore contemporary and classic art exhibits across three floors. Current featured exhibition: Modern Landscapes.",
    location: "Brooklyn Museum, 200 Eastern Pkwy, Brooklyn, NY",
    category: "Art & Culture",
    estimated_cost: 20,
    duration_minutes: 120,
    indoor: true,
    tags: ["indoor", "art", "culture", "museum"],
    source: "claude",
    event_url: "https://example.com/brooklyn-museum",
    start_time: "10:30",
    start_time_as_ampm: "10:30 AM",
    end_time: "12:30",
    end_time_as_ampm: "12:30 PM",
    verified: true,
  },
  {
    name: "Smorgasburg Food Market",
    description:
      "Sample dishes from over 100 local food vendors at this iconic open-air food market. Try everything from ramen burgers to artisanal ice cream.",
    location: "Williamsburg Waterfront, Brooklyn, NY",
    category: "Food & Dining",
    estimated_cost: 25,
    duration_minutes: 90,
    indoor: false,
    tags: ["outdoor", "food", "market", "lunch"],
    source: "claude",
    event_url: "https://example.com/smorgasburg",
    start_time: "12:30",
    start_time_as_ampm: "12:30 PM",
    end_time: "14:00",
    end_time_as_ampm: "2:00 PM",
    verified: true,
  },
  {
    name: "Live Jazz at Blue Note",
    description:
      "Catch an afternoon jazz set at one of New York's most legendary jazz clubs. Features rotating lineup of world-class musicians.",
    location: "Blue Note Jazz Club, 131 W 3rd St, New York, NY",
    category: "Music & Entertainment",
    estimated_cost: 30,
    duration_minutes: 90,
    indoor: true,
    tags: ["indoor", "music", "jazz", "nightlife"],
    source: "claude",
    event_url: "https://example.com/blue-note",
    start_time: "15:00",
    start_time_as_ampm: "3:00 PM",
    end_time: "16:30",
    end_time_as_ampm: "4:30 PM",
    verified: false,
  },
  {
    name: "Sunset Walk on the High Line",
    description:
      "Enjoy a scenic stroll along the elevated park built on a former rail line. Beautiful views of the Hudson River and city skyline at sunset.",
    location: "The High Line, New York, NY",
    category: "Nature & Sightseeing",
    estimated_cost: 0,
    duration_minutes: 60,
    indoor: false,
    tags: ["outdoor", "nature", "walking", "free"],
    source: "claude",
    event_url: "https://example.com/high-line",
    start_time: "17:00",
    start_time_as_ampm: "5:00 PM",
    end_time: "18:00",
    end_time_as_ampm: "6:00 PM",
    verified: true,
  },
];

let savedEventIdCounter = 100;

export const mockSavedEvents = [
  {
    id: 1,
    user_id: 1,
    title: "Morning Yoga in the Park",
    date: "2026-06-15",
    time: "9:00 AM",
    location: "Central Park Great Lawn, New York, NY",
    tag: "Fitness & Wellness",
    price: "15",
    saved_at: "2026-06-12T10:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    title: "Brooklyn Art Museum Visit",
    date: "2026-06-15",
    time: "10:30 AM",
    location: "Brooklyn Museum, 200 Eastern Pkwy, Brooklyn, NY",
    tag: "Art & Culture",
    price: "20",
    saved_at: "2026-06-12T10:01:00Z",
  },
  {
    id: 3,
    user_id: 1,
    title: "Sunset Walk on the High Line",
    date: "2026-06-15",
    time: "5:00 PM",
    location: "The High Line, New York, NY",
    tag: "Nature & Sightseeing",
    price: "Free",
    saved_at: "2026-06-12T10:02:00Z",
  },
];

export function getNextSavedEventId() {
  savedEventIdCounter += 1;
  return savedEventIdCounter;
}