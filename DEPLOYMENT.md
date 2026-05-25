# PRism AI Deployment Guide

This guide deploys the production MVP with:

- Frontend: Vercel
- Backend: Render Web Service
- Database: Supabase Postgres or Render Postgres
- Auth: Clerk with GitHub social OAuth
- AI: BYOK OpenAI/OpenRouter plus optional server fallback keys

## A. Backend On Render

1. Create a new Render Web Service from this repository.
2. Set `Root Directory` to `backend`.
3. Use these commands:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

4. Add environment variables:

```text
ENV=production
BACKEND_URL=https://your-render-service.onrender.com
FRONTEND_URL=https://your-vercel-app.vercel.app
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWKS_URL=https://your-clerk-domain/.well-known/jwks.json
GITHUB_AUTH_MODE=clerk_oauth
GITHUB_WEBHOOK_SECRET=...
APP_ENCRYPTION_KEY=<long random secret>
OPENAI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_APP_URL=https://your-vercel-app.vercel.app
OPENROUTER_APP_NAME=PRism AI
DEFAULT_AI_PROVIDER=openai
DEFAULT_OPENAI_MODEL=gpt-4o-mini
DEFAULT_OPENROUTER_MODEL=openai/gpt-4o-mini
```

5. Deploy, then verify:

```text
https://your-render-service.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "environment": "production",
  "version": "0.1.0"
}
```

## B. Database

Use Supabase Postgres or Render Postgres.

1. Create a Postgres database.
2. Copy the connection string into `DATABASE_URL`.
3. From the backend directory, run migrations:

```bash
alembic upgrade head
```

Render options:

- Run migrations manually from a local shell with production `DATABASE_URL`.
- Or use a Render one-off job/shell before opening traffic.

The production schema includes:

- `user_connections`
- `review_jobs`
- `findings`
- `logs`
- `oauth_sessions`
- `user_ai_keys`
- `connected_repositories`
- `repo_memory_chunks`

## C. Frontend On Vercel

1. Import the repository in Vercel.
2. Set `Root Directory` to `frontend`.
3. Set install/build commands:

```bash
pnpm install
pnpm build
```

4. Add environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

5. Deploy.

## D. Clerk Production Setup

1. Create or open your Clerk application.
2. Add the Vercel production URL to allowed origins/redirect URLs.
3. Enable GitHub social connection.
4. Enable custom GitHub OAuth credentials.
5. Configure GitHub OAuth scopes:

```text
read:user
user:email
repo
workflow
```

6. In GitHub Developer Settings, create an OAuth App:

- Homepage URL: your Vercel production URL
- Callback URL: the callback URL shown by Clerk

7. Copy the GitHub OAuth Client ID and Secret into Clerk.
8. Users must reconnect GitHub after scope changes.

## E. Post-Deployment Test

1. Open the Vercel frontend.
2. Sign in with Clerk/GitHub.
3. Open GitHub Permission Status and confirm required scopes are present.
4. Open `/repositories`.
5. Select a repository with an open PR.
6. Open Review Workspace.
7. Fetch PR and verify Monaco diff renders.
8. Run AI Review and watch SSE timeline/agent graph.
9. Save an OpenAI or OpenRouter BYOK key in Settings.
10. Run a review and confirm the AI Provider card reflects the provider/model.
11. Approve and reject findings.
12. Post approved comments to GitHub.

## F. Security Checklist

- Do not put GitHub tokens in frontend storage.
- Do not log GitHub, OpenAI, or OpenRouter keys.
- Set `APP_ENCRYPTION_KEY` before saving BYOK keys.
- Use production Clerk keys for production.
- Use production CORS with only `FRONTEND_URL`.
- Prefer GitHub App installation tokens for a production SaaS rollout.
