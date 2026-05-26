import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";

const scopes = [
  ["read:user", "Reads GitHub profile information for account display and connection checks."],
  ["user:email", "Identifies the signed-in user email when GitHub provides it."],
  ["repo", "Reads private/public repositories, pull requests, changed files, diffs, and posts approved PR or issue comments."],
  ["workflow", "Reserved for future GitHub Actions and CI signal analysis."],
];

export default function SetupGuidePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Self-hosting guide</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">PRism AI Setup Guide</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Configure Clerk, GitHub OAuth, environment variables, and deployment settings before running AI pull request reviews.
          </p>
        </div>

        <GuideSection title="Clerk Setup">
          <ol className="space-y-3 text-sm leading-6 text-muted">
            <li>1. Create a Clerk application.</li>
            <li>2. Enable GitHub as a social connection.</li>
            <li>3. Enable custom credentials for GitHub.</li>
            <li>4. Add your GitHub OAuth Client ID and Client Secret.</li>
            <li>5. Add your local and production frontend URLs to Clerk allowed redirect/origin settings.</li>
            <li>6. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into your frontend/backend environments.</li>
          </ol>
          <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-100">
            Email, password, Google, or magic-link sign-in only authenticates the PRism AI user. It does not provide GitHub repository scopes. Those users must also connect GitHub through Clerk before repositories, PR diffs, or comment posting can work.
          </p>
        </GuideSection>

        <GuideSection title="GitHub OAuth App Setup">
          <ol className="space-y-3 text-sm leading-6 text-muted">
            <li>1. Open GitHub Developer Settings.</li>
            <li>2. Create an OAuth App.</li>
            <li>3. Set Homepage URL to `http://localhost:3000` locally or your Vercel URL in production.</li>
            <li>4. Set Authorization callback URL to the callback URL shown by Clerk.</li>
            <li>5. Copy Client ID and Client Secret into Clerk custom GitHub credentials.</li>
            <li>6. After changing scopes, reconnect GitHub so Clerk receives a fresh token.</li>
          </ol>
        </GuideSection>

        <GuideSection title="Required Scopes">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scopes.map(([scope, purpose]) => (
                  <tr key={scope}>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{scope}</td>
                    <td className="px-4 py-3 text-muted">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-100">
            MVP OAuth uses broad GitHub scopes. Production SaaS should migrate repository access to a GitHub App with selected repository installation and least-privilege permissions.
          </p>
        </GuideSection>

        <GuideSection title="Environment Variables">
          <pre className="overflow-x-auto rounded-lg border border-border bg-panel p-4 text-xs leading-6 text-muted">{`# Backend
ENV=development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_JWKS_URL=
GITHUB_AUTH_MODE=clerk_oauth
APP_ENCRYPTION_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`}</pre>
        </GuideSection>

        <GuideSection title="Local Development">
          <pre className="overflow-x-auto rounded-lg border border-border bg-panel p-4 text-xs leading-6 text-muted">{`cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd frontend
pnpm install
pnpm dev`}</pre>
        </GuideSection>

        <GuideSection title="Production Deployment">
          <p className="text-sm leading-6 text-muted">
            Deploy the backend on Render, frontend on Vercel, and set `DATABASE_URL` to Supabase or Render Postgres. Run `alembic upgrade head` before production traffic. See <Link className="text-primary hover:underline" href="/setup-guide">this guide</Link> and the repository `DEPLOYMENT.md`.
          </p>
        </GuideSection>

        <GuideSection title="Common Errors">
          <ul className="space-y-3 text-sm leading-6 text-muted">
            <li><span className="font-semibold text-foreground">GitHub not connected:</span> the user may have signed in with email or another provider. Connect GitHub in Clerk, then refresh permission status.</li>
            <li><span className="font-semibold text-foreground">No repositories found:</span> reconnect GitHub after adding `repo` scope.</li>
            <li><span className="font-semibold text-foreground">Comment posting denied:</span> the token is missing `repo` scope or does not have repository access.</li>
            <li><span className="font-semibold text-foreground">BYOK save failed:</span> set `APP_ENCRYPTION_KEY` and restart the backend.</li>
            <li><span className="font-semibold text-foreground">CORS blocked:</span> set backend `FRONTEND_URL` to the exact Vercel domain in production.</li>
            <li><span className="font-semibold text-foreground">Old scopes still shown:</span> revoke/reconnect the GitHub OAuth App authorization.</li>
          </ul>
        </GuideSection>
      </div>
    </main>
  );
}

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border border-border bg-background p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
