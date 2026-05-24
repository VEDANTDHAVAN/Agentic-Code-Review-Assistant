# Agentic Code Review Assistant Frontend

Next.js App Router dashboard for the existing FastAPI backend.

## Setup

Create `frontend/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Install and run:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Enter GitHub token, owner, repo, and PR number.
2. Click `Fetch PR`.
3. Click `Run Review`.
4. Watch streamed agent logs and graph state.
5. Approve or reject findings locally.
6. Click `Post Approved` to send approved, unposted findings to the backend.
