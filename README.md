# AI YouTube Learning Platform Backend

This backend powers an AI-assisted learning platform for YouTube videos.

## Features

- JWT Authentication
- Video metadata persistence
- Notes and bookmarks
- Watch progress tracking
- AI-powered summaries
- AI Q&A
- AI quiz generator
- Study planner / goals
- Learning analytics dashboard

## Tech Stack

Node.js  
Express  
MongoDB (Mongoose)  
OpenRouter AI API

## Setup

Install dependencies:

npm install

Create `.env` file based on `.env.example`

Start server:

node server.js

Server runs on:

http://localhost:5000

## Main API Routes

Auth

POST /api/auth/register  
POST /api/auth/login  
GET /api/auth/me  

Videos

GET /api/videos/meta/:youtubeId  

Notes

POST /api/notes  
GET /api/notes/:youtubeId  

Bookmarks

POST /api/bookmarks  

AI

POST /api/ai/summary/:youtubeId  
POST /api/ai/ask/:youtubeId  
POST /api/ai/quiz/:youtubeId  

Planner

POST /api/planner  
GET /api/planner  

Analytics

GET /api/analytics/dashboard  
GET /api/analytics/video/:youtubeId  

## AI Provider

Currently using OpenRouter free models.

Easily replaceable in:

services/ai/aiClient.js

## Future Improvements

Transcript reliability  
Personalized AI tutor  
Spaced repetition  
Advanced analytics