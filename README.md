# SlackIncidentBot

[![Rust](https://img.shields.io/badge/Rust-%23dea584?style=flat-square&logo=rust)](#) [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#)

> Declare, escalate, resolve, and post-mortem — a complete incident lifecycle in Slack, built in Rust and deployable in minutes.

SlackIncidentBot orchestrates the full incident lifecycle from a single Slack slash command. Declare a P1 and it creates a dedicated channel, alerts the right people, posts to Statuspage, and starts the timeline. Resolve it and the bot computes duration, triggers a post-mortem template, and logs everything to PostgreSQL with compile-time query validation.

## Features

- **Full Lifecycle Management** — Declare (P1–P4), update status, escalate severity, resolve, and generate post-mortems from Slack
- **Intelligent Notifications** — P1 broadcasts to `#general` and DMs executives; P2 posts to `#engineering`; P3/P4 stay channel-local; duplicate throttling (5-minute window) prevents alert storms
- **Statuspage Integration** — Automatic component status updates on incident declare and resolve; severity-aware status mapping; graceful degradation if Statuspage is unavailable
- **Compile-Time Query Validation** — SQLx with PostgreSQL validates queries at compile time — schema drift is a build error, not a runtime surprise
- **Commander Permissions** — Critical operations (escalation, resolution) are gated to the incident commander role
- **Full Audit Trail** — Every state transition, notification, and status change is persisted to PostgreSQL with timestamps

## Quick Start

### Prerequisites

- Rust 1.70+ ([rustup](https://rustup.rs/))
- PostgreSQL 16+
- Slack workspace with admin access (to create a Slack app)

### Installation

```bash
git clone https://github.com/saagpatel/SlackIncidentBot.git
cd SlackIncidentBot
cp .env.example .env
# Fill in SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, DATABASE_URL, etc.
```

### Run database migrations

```bash
cargo sqlx migrate run
```

### Run (development)

```bash
cargo run
```

### Docker

```bash
docker-compose up
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Rust (edition 2021) |
| HTTP server | Axum 0.8 |
| Async runtime | Tokio |
| Database | PostgreSQL 16 + SQLx 0.8 |
| Slack API | Reqwest (raw HTTP) |
| Statuspage | Reqwest (async job queue) |
| Logging | Tracing + tracing-subscriber (JSON) |
| Config | config + dotenvy |
| Deployment | Docker + Fly.io |

## Architecture

The bot is a single Axum server that receives Slack events and slash commands. Each incoming request is signature-verified against the Slack signing secret before processing. Incident state transitions run through a service layer that writes to PostgreSQL via SQLx. Statuspage updates are enqueued as async background jobs so slow external calls never block the Slack response window. All config is read from environment variables validated at startup.

## License

MIT
