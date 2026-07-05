import {
  mockUser,
  mockAccessToken,
  mockRecommendations,
  mockSavedEvents,
  getNextSavedEventId,
} from "./data";

type MockResponse = {
  status: number;
  body: unknown;
};

const savedEvents = [...mockSavedEvents];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function matchRoute(
  url: string,
  method: string,
): MockResponse | null {
  // --- Auth ---
  if (url.includes("/api/auth/login") && method === "POST") {
    return {
      status: 200,
      body: { access_token: mockAccessToken, user: mockUser },
    };
  }

  if (url.includes("/api/auth/register") && method === "POST") {
    return {
      status: 200,
      body: { access_token: mockAccessToken, user: mockUser },
    };
  }

  if (url.includes("/api/auth/forgot-password") && method === "POST") {
    return {
      status: 200,
      body: { message: "Password reset email sent." },
    };
  }

  if (url.includes("/api/auth/reset-password") && method === "POST") {
    return {
      status: 200,
      body: { message: "Password has been reset successfully." },
    };
  }

  // --- Recommendations ---
  if (url.includes("/events/recommendations") && method === "POST") {
    return {
      status: 200,
      body: mockRecommendations,
    };
  }

  // --- Saved events: DELETE /saved/:id ---
  const deleteMatch = url.match(/\/saved\/(\d+)$/);
  if (deleteMatch && method === "DELETE") {
    const id = Number(deleteMatch[1]);
    const index = savedEvents.findIndex((e) => e.id === id);
    if (index !== -1) {
      savedEvents.splice(index, 1);
    }
    return { status: 200, body: { message: "Deleted" } };
  }

  // --- Saved events: POST /saved ---
  if (url.match(/\/saved\/?$/) && method === "POST") {
    return null; // handled separately because we need the request body
  }

  // --- Saved events: GET /saved ---
  if (url.match(/\/saved\/?$/) && method === "GET") {
    return {
      status: 200,
      body: [...savedEvents],
    };
  }

  return null;
}

export function installMockFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function mockFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();

    // Handle POST /saved separately to read the body
    if (url.match(/\/saved\/?$/) && method === "POST") {
      await delay(300);
      try {
        const body = JSON.parse(init?.body as string);
        const newEvent = {
          id: getNextSavedEventId(),
          user_id: mockUser.id,
          title: body.title ?? "Untitled",
          date: body.date ?? "",
          time: body.time ?? "",
          location: body.location ?? "",
          tag: body.tag ?? "",
          price: body.price ?? "N/A",
          saved_at: new Date().toISOString(),
        };
        savedEvents.push(newEvent);
        console.log("[mock] POST /saved →", newEvent);
        return json(newEvent, 200);
      } catch {
        return json({ detail: "Invalid request body" }, 400);
      }
    }

    const matched = matchRoute(url, method);

    if (matched) {
      await delay(300);
      console.log(`[mock] ${method} ${url} → ${matched.status}`);
      return json(matched.body, matched.status);
    }

    // Fall through to real fetch for unmatched routes (e.g. static assets)
    return originalFetch(input, init);
  };

  console.log("[mock] Mock API handlers installed");
}