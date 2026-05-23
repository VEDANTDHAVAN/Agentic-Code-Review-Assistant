# Agentic Code Review Assistant

Functional MVP for reviewing GitHub pull request diffs with modular AI-style agents. It fetches PR metadata and changed files, streams agent logs over Server-Sent Events, detects security, bug, performance, and code-smell findings, lets a human approve or reject each suggestion, then posts approved comments back to GitHub.

The app works without a GitHub token by falling back to deterministic demo PR data.

## Stack

- Backend: FastAPI, Python, SQLite, SSE
- Frontend: Next.js, TypeScript, Tailwind CSS, Monaco Editor, React Flow, lucide icons
- Integrations: GitHub REST API with Personal Access Token auth
- AI: provider abstraction with deterministic fallback when no API keys exist

## Project Structure

```text
backend/
  app/
    main.py
    api/
    agents/
    services/
    models/
    core/
  requirements.txt
frontend/
  app/
  components/
  lib/
  package.json
.env.example
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` at the repo root if you want to customize settings.

For GitHub posting, use a PAT with access to the target repository. For classic tokens, `repo` scope is sufficient for private repos. Public-only usage can use narrower public repo permissions.

AI provider keys are optional:

```text
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

When no provider key is present, the summary and review flow remain deterministic for demos.

## Demo Flow

1. Start the backend on port `8000`.
2. Start the frontend on port `3000`.
3. Leave GitHub PAT empty.
4. Keep the default `demo / agentic-demo / PR 1` values.
5. Click `Fetch` to load mock PR metadata and a diff.
6. Click `Run Review`.
7. Watch live agent events stream in the timeline and active nodes highlight in the pipeline graph.
8. Approve or reject suggested comments.
9. Click `Post` on an approved finding. Without a token, posting is simulated and the finding is marked posted.

## API Summary

- `POST /github/pr/fetch`: fetch PR metadata, changed files, and diffs. Falls back to mock data if no token or GitHub fetch fails.
- `POST /review/run`: starts the review pipeline and returns `job_id`.
- `GET /review/stream/{job_id}`: streams SSE log events.
- `GET /review/results/{job_id}`: returns job status, findings, summary, and logs.
- `PATCH /review/findings/{finding_id}/approval`: approve or reject a finding.
- `POST /review/comment/post`: posts one approved comment to GitHub or simulates posting without a token.

## Implemented Agents

- `PRFetcherAgent`
- `ContextBuilderAgent`
- `SecurityReviewAgent`
- `BugDetectionAgent`
- `PerformanceReviewAgent`
- `CodeSmellAgent`
- `SummaryAgent`

Each agent accepts the shared context dict, emits logs, and returns structured findings where applicable.

## MVP Detection Rules

Security:
- Hardcoded secrets
- `eval` usage
- SQL string concatenation
- Unsafe shell execution

Bugs:
- Missing key/null guard risks
- Broad exception handling
- Swallowed errors

Performance:
- Nested loops
- API or database calls inside loops

Code smells:
- Large function risk
- Duplicate logic
- Unclear naming

## Notes

Line-level GitHub comments use the PR review comments endpoint when a finding has a file path and line number. If line posting fails or a finding is PR-level, the backend posts a general issue comment on the PR.
