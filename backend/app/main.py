"""This is the main entry point for the FastAPI application.
It sets up the application and configures CORS middleware to allow requests from specified origins.

Routers:
- health: Provides a simple health check endpoint to 
          verify that the API is running.
          
"""
from fastapi import FastAPI
from .middleware.cors import add_cors_middleware
from .routers import health, events, planner, interests
from .routers.auth import router as auth_router
from .routers.saved import router as saved_router
from .db.database import init_db


init_db()

app = FastAPI()
add_cors_middleware(app)

@app.get("/")
def root():
    """A simple root endpoint to verify that the API is running."""
    return {"app": "WhatToDo API"}
app.include_router(health.router)
app.include_router(events.router)
app.include_router(auth_router)
app.include_router(saved_router)
app.include_router(planner.router)
app.include_router(interests.router)
