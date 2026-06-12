# What To Do

## CS5500 – Foundations of Software Engineering  
Final Project Proposal

### Team Members
- Shiqiu Chen
- Songting Yang
- Manuel Magana
- Qian Li

---

## Project Overview

**What To Do** is an AI-powered activity planning system that helps users quickly decide how to spend their free time. Instead of manually searching across multiple platforms such as event websites, maps, social media, and calendars, the system generates personalized activity recommendations and structured schedules based on user preferences.

The goal is to reduce decision fatigue and make planning faster by combining AI-powered intent detection, event discovery, and calendar integration.

---

## Problem Statement

Many users struggle to decide how to spend their free time even when they know their interests. Existing tools require users to manually search across multiple platforms, compare options, and organize plans themselves.

This often leads to:

- Decision fatigue  
- Time wasted searching across different platforms  
- Difficulty converting ideas into actionable schedules  

---

## Objective

The goal of **What To Do** is to create an AI-powered planning assistant that generates activity suggestions, itineraries, and calendar schedules based on user interests, location, and time availability.

The application reduces manual planning effort through:

- AI-based intent recognition  
- Real-world event discovery  
- Calendar integration  

---

## Example Use Case

### Generate a Weekend Itinerary

**Actor:** User

**Scenario:**  
A user wants to plan activities for the weekend.

### Steps

1. The user fills in UI fields such as location, time range, and indoor/outdoor preference.
2. The system retrieves relevant events and activities using event APIs and map services.
3. The system generates a suggested itinerary.
4. The user downloads the plan as an ICS file or saves it.

### Outcome

The user receives a complete activity plan without needing to manually search for events.

---

## Project Scope

The system includes the following components:

- User input through the UI  
- AI intent detection and response generation  
- Activity and event retrieval from external sources  
- Data normalization into a consistent activity format  
- Itinerary generation  
- Calendar schedule export as an ICS file  

---

## Technology Stack

### Frontend
- React.js
- Tailwind CSS or Material UI

### Backend
- Node.js or Python with FastAPI
- PostgreSQL
- AWS RDS for database hosting
- AWS SES for email services

### AI Engine
- OpenAI API (or equivalent LLM)

---

## External Interfaces

The application integrates with external services including:

- OpenAI API (or equivalent LLM) for AI-powered recommendations  
- Event or location APIs for activity discovery  

---

## Functional Requirements

1. The system shall allow users to provide preferences through the UI (time, location, indoor/outdoor, etc.).
2. The system shall classify user intent as interest-based or time-based.
3. The system shall retrieve activities and events using AI-powered queries.
4. The system shall normalize activity data into a unified format (title, location, time, description).
5. The system shall rank and filter results based on relevance, distance, and user constraints.
6. The system shall generate a structured itinerary.
7. The system shall generate an ICS calendar file from the itinerary.
8. The system shall display recommendations clearly in the UI.

---

## Non-Functional Requirements

### Performance
Results should be generated within **45 seconds**, depending on external API response times.

### Reliability
The system should handle failed API calls gracefully and return partial results when possible.

### Usability
The interface should be simple and require minimal steps for users to generate a plan.

### Security & Privacy
User inputs such as location and preferences should be protected and not stored unless required.

---

## Development Timeline

### Week 6
Requirements finalization and UI design

### Week 7 – Week 12
Backend setup and external API integration

### Week 13
Testing and improvements

### Week 14
Deployment and final documentation/demo

**Total Estimated Time:** 9 weeks

# Deployment Details
The application API is hosted on AWS apprunner, and the frontend is hosted on Vercel. The backend API is accessible at `https://mk2tba6npp.us-east-1.awsapprunner.com`, and the frontend is accessible at `https://cs-5500-final-project-seven.vercel.app/`. The database is hosted on AWS RDS, and the email service is configured using AWS SES.




The workflow for deployment includes:
1. **Development**: Code is developed locally and pushed to GitHub.
2. **CI/CD**: GitHub Actions are set up to automatically pushes the image to AWS ECR. The image must be deployed manually to AWS App Runner.
3. **Frontend Deployment**: The frontend is deployed to Vercel, which automatically builds and deploys the application when changes are pushed to the main branch.
4. **Testing**: After deployment, the application is tested to ensure all functionalities work as expected.
