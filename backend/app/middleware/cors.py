"""Contains middleware for handling CORS 
(Cross-Origin Resource Sharing) in the 
FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:3002",
    "https://cs-5500-final-project-ybji.vercel.app",
    "https://cs-5500-final-project-ybji-manuel-magana-devs-projects.vercel.app",
    "https://cs-5500-final-project-ybji-git-main-manuel-magana-devs-projects.vercel.app",
    "https://what-to-do-app-two.vercel.app",
    "https://vercel.live",
    "https://cs-5500-final-project-guw0aqwgw-shiqius-projects.vercel.app",
    "https://cs-5500-final-project-seven.vercel.app"
]

def add_cors_middleware(app: FastAPI):
    """Adds CORS middleware to the FastAPI application to allow requests from specified origins."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
