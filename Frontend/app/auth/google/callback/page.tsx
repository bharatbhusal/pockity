"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { refetch } = useAuth();

  useEffect(() => {
    // After OAuth completes, backend sets the cookie and redirects here
    // We need to refetch the user profile to update the auth state
    const handleCallback = async () => {
      try {
        // Wait a moment for cookie to be set
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refetch user profile
        await refetch();

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (error) {
        console.error("OAuth callback error:", error);
        router.push("/");
      }
    };

    handleCallback();
  }, [refetch, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h1 className="text-2xl font-bold">Completing sign in...</h1>
        <p className="mt-2 text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
