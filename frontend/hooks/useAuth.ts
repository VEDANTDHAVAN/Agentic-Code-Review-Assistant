"use client";

import { useClerk, useUser } from "@clerk/nextjs";

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();

  return {
    authenticated: Boolean(isSignedIn),
    loading: !isLoaded,
    user: user
      ? {
          id: 0,
          login: user.username ?? user.primaryEmailAddress?.emailAddress ?? user.id,
          name: user.fullName,
          avatar_url: user.imageUrl,
          html_url: null,
        }
      : null,
    logout: () => clerk.signOut({ redirectUrl: "/" }),
  };
}
