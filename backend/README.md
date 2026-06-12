# WhatToDo API

FastAPI backend for generating event recommendations, managing saved events, and handling user authentication.

## Tech Stack

- Python 3.13
- FastAPI
- SQLAlchemy
- Uvicorn
- Docker / Docker Compose
- JWT authentication
- bcrypt password hashing
- OpenAI and Claude recommendation providers

## Environment Variables

Create a `.env` file in the root directory of the project.

```env
APP_PORT=3000

SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

Depending on which recommendation providers you use, also add the required API keys:

```env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

Set up reset password

```SMTP_HOST=""
SMTP_PORT=587
SMTP_USERNAME=""
SMTP_PASSWORD=""
FROM_EMAIL=""
```

## Building and Running the API

Build and start the service:

```bash
docker compose build --no-cache && docker compose up
```

The API will be available at:

```text
http://localhost:3000
```

The container runs Uvicorn on port `80`, while Docker Compose should map it to the local `APP_PORT`, such as `3000`.

## Health Check

### GET `/health`

Check whether the API is running.

```bash
curl http://localhost:3000/health
```

## Authentication

Authentication routes are mounted under `/auth`.

### POST `/auth/register`

Create a new user account.

#### Request Body

```json
{
  "username": "test",
  "email": "test@gmail.com",
  "password": "securepassword",
  "name": "Test"
}
```

#### Response

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "test",
    "email": "test@gmail.com",
    "name": "Test"
  }
}
```

### POST `/auth/login`

Log in with either username or email.

#### Request Body

```json
{
  "username": "test",
  "password": "securepassword"
}
```

#### Response

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "test",
    "email": "test@gmail.com",
    "name": "Test"
  }
}
```

### POST `/auth/forgot-password`

Request a password reset email.

#### Request Body

```json
{
  "email": "test@gmail.com"
}
```

#### Response

```json
{
  "message": "If an account with that email exists, password reset instructions have been sent"
}
```

### POST `/auth/reset-password`

Reset a password using a valid reset token.

#### Request Body

```json
{
  "token": "password-reset-token",
  "new_password": "newsecurepassword"
}
```

#### Response

```json
{
  "message": "Password has been reset successfully"
}
```

## Event Recommendations

### POST `/events/recommendations`

Generate event recommendations based on city, interests, budget, date range, and optional preferred time window.

The recommendation provider can be selected with the `provider` query parameter.

Supported providers:

- `openai`
- `claude`

Default provider:

```text
openai
```

### Example Request

```bash
curl -X POST "http://localhost:3000/events/recommendations?provider=claude" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "interests": "live music, food",
    "budget": 50,
    "date_range": "2026-03-15 to 2026-03-20"
  }'
```

### Example Request Body

```json
{
  "city": "San Francisco",
  "interests": "live music, food",
  "budget": 50,
  "date_range": "2026-03-15 to 2026-03-20"
}
```

### Example Response

```json
[
  {
    "name": "Club Mandalay: Jazz & Ancestral Philippine Music at the I-Hotel",
    "description": "Live jazz and pre-colonial Philippine music & dance at the I-Hotel—an afternoon of belonging, memory, and shared community.",
    "location": "International Hotel Manilatown Center, San Francisco, CA",
    "category": "entertainment",
    "estimated_cost": 0.0,
    "duration_minutes": 180,
    "indoor": true,
    "tags": [
      "free",
      "jazz",
      "cultural",
      "live-music",
      "donations-appreciated"
    ],
    "source": "Eventbrite",
    "event_url": "https://www.eventbrite.com/e/club-mandalay-jazz-ancestral-philippine-music-at-the-i-hotel-tickets-1983026462531",
    "start_time": "2026-03-14T14:00:00",
    "end_time": "2026-03-14T17:00:00",
    "verified": false
  }
]
```

## Start and End Time Filtering

The recommendations endpoint supports filtering events by preferred time of day.

Use:

- `day_start_time`
- `day_end_time`

### Example Request Body

```json
{
  "city": "San Francisco",
  "interests": "live music, food",
  "budget": 50,
  "date_range": "2026-03-15 to 2026-03-20",
  "day_start_time": "4PM",
  "day_end_time": "9PM"
}
```

### Example Response

```json
[
  {
    "name": "Nine Inch Nails",
    "description": "Major arena concert featuring the iconic industrial rock band Nine Inch Nails at Chase Center.",
    "location": "Chase Center, San Francisco, CA",
    "category": "entertainment",
    "estimated_cost": 45.0,
    "duration_minutes": 60,
    "indoor": true,
    "tags": [
      "live-music",
      "rock",
      "industrial",
      "arena-show"
    ],
    "source": "Concert Listing",
    "event_url": "https://www.amsires.com/new-year-new-events-top-san-francisco-events-to-start-the-year",
    "start_time": "2026-03-15T20:00:00",
    "end_time": "2026-03-15T21:00:00",
    "verified": false
  }
]
```

## Saved Events

Saved event routes are mounted under `/saved`.

All saved event routes require authentication.

```http
Authorization: Bearer <access_token>
```

### GET `/saved`

Get all saved events for the current user.

```bash
curl http://localhost:3000/saved \
  -H "Authorization: Bearer <access_token>"
```

### POST `/saved`

Save a new event for the current user.

```bash
curl -X POST http://localhost:3000/saved \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "Jazz Night",
    "date": "2026-03-15",
    "time": "7:00 PM",
    "location": "San Francisco, CA",
    "tag": "live-music",
    "price": "25"
  }'
```

### DELETE `/saved/{event_id}`

Delete a saved event by ID.

```bash
curl -X DELETE http://localhost:3000/saved/1 \
  -H "Authorization: Bearer <access_token>"
```

Returns `204 No Content` when successful.

## Dockerfile

The API container uses Python 3.13.

```dockerfile
FROM python:3.13

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app
COPY ./prompts /code/prompts

EXPOSE 80

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
```

## Notes

- `/events/recommendations` does not require authentication.
- `/saved` routes require authentication.
- Password reset tokens expire after 15 minutes.
- Access token expiration defaults to `10080` minutes, or 7 days.
- The `provider` query parameter controls whether OpenAI or Claude is used for recommendations.
