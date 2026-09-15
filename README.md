# Farm Risk & Carbon Platform

Competition MVP for a digital platform that connects farm records, insurance, sustainability scoring, rewards, and carbon project readiness.

## Overview

The platform builds a longitudinal **Digital Farm Track Record** that connects:

```
Digital Farm ID → Insurance → Farm Data → Sustainability Score →
Rewards → Carbon Readiness → Aggregation → Candidate Carbon Project
```

The MVP includes three main roles:

- **FARMER** — manage farm, insurance, farm data, score, rewards, and carbon readiness
- **CORPORATE** — view aggregated carbon project information
- **ADMIN** — review farm data and manage candidate carbon projects

## Tech Stack

### Mobile

- React Native
- Expo
- TypeScript
- Expo Router

### Backend

- NestJS
- TypeScript
- REST API

### Database & Infrastructure

- PostgreSQL
- Token-based authentication
- Monorepo

## Project Structure

```
farm-risk-carbon-platform/
├── mobile/          # React Native + Expo application
├── backend/         # NestJS REST API
├── docs/            # Product & engineering documentation
├── AGENTS.md        # Engineering rules
├── TASKS.md         # Development tasks
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Expo Go
- PostgreSQL

### 1. Clone the Repository

```bash
git clone <repository-url>
cd farm-risk-carbon-platform
```

### 2. Install Dependencies

Install mobile dependencies:

```bash
cd mobile
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

### 3. Configure Environment Variables

Create the required environment files:

```
mobile/
└── .env

backend/
└── .env
```

Refer to the project documentation for the required environment variables.

### 4. Run the Mobile App

```bash
cd mobile
npm run start
```

Open the application using Expo Go or an available emulator.

### 5. Run the Backend

```bash
cd backend
npm run start:dev
```

The backend will run in development mode.

## Documentation

Detailed product and engineering documentation is available in `docs/`.

| Document             | Description                  |
| --------------------- | ----------------------------- |
| `PRD.md`              | Product requirements          |
| `MVP-SCOPE.md`        | MVP scope and boundaries      |
| `DESIGN-SYSTEM.md`    | UI design system              |
| `UI-SPEC.md`          | Screen specifications         |
| `BUSINESS-RULES.md`   | Business and domain rules     |
| `DATABASE.md`         | Database design                |
| `ERD.md`              | Entity relationship diagram   |
| `API.md`              | API contract                  |
| `ARCHITECTURE.md`     | Code architecture             |
| `DEVELOPMENT.md`      | Development workflow          |

For AI-assisted development, start with `AGENTS.md`.

## Product Boundaries

This project is a competition MVP, not a production insurance or carbon-credit platform.

- The platform is not an insurance company.
- Real underwriting and policy issuance belong to licensed insurance partners.
- FSS and CRS are internal platform indicators, not carbon credits.
- Corporate views use aggregated project information.
- Real MRV, registry issuance, carbon trading, and revenue distribution are outside the MVP.

## Development Principles

The implementation should remain simple and aligned with the PRD.

- Build the smallest solution that satisfies the MVP.
- Prefer existing Expo and React Native capabilities before adding native dependencies.
- Avoid premature abstractions.
- Keep business rules explicit and explainable.
- Avoid speculative features.
- Do not introduce features outside the PRD without marking them as Recommendation, Assumption, or TBD.

## Status

**Competition MVP — In Development**

The current focus is delivering the core farmer, corporate, and admin flows with a functional mobile application and backend.

## Source of Truth

The original product requirements are based on:

`Farm_Risk_Carbon_Platform_PRD_v2.pdf`

The Markdown documentation in this repository translates the PRD into implementation-ready guidance.