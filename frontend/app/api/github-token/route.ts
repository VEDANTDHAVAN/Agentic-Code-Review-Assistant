import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const response = await client.users.getUserOauthAccessToken(userId, "oauth_github");
  const tokens = Array.isArray(response) ? response : response.data;
  const first = tokens?.[0] as { token?: string; accessToken?: string } | undefined;
  const token = first?.token ?? first?.accessToken;

  if (!token) {
    return NextResponse.json({ error: "No GitHub OAuth token found. Enable GitHub social connection in Clerk." }, { status: 404 });
  }

  return NextResponse.json({ token });
}
