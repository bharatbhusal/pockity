"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Sign In</CardTitle>
          <CardDescription>Hiiii</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Continue with</span>
          </div>

          <GoogleOAuthButton />
        </CardContent>
      </Card>
    </div>
  );
}
