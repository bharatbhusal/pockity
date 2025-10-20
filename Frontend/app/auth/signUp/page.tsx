"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";

export default function SignUpPage() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const requestRegisterMutation = useMutation({
    mutationFn: api.auth.requestRegister,
    onSuccess: () => {
      setStep("otp");
      toast({
        title: "OTP sent",
        description: "Check your email for the verification code.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyRegisterMutation = useMutation({
    mutationFn: api.auth.verifyRegister,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your account has been created successfully.",
      });
      router.push("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRequestRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    requestRegisterMutation.mutate({ email });
  };

  const handleVerifyRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }
    verifyRegisterMutation.mutate({ email, otp, password, name });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Sign Up</CardTitle>
          <CardDescription>
            {step === "details" ? "Create a new account to get started" : "Enter the code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "details" ? (
            <form
              onSubmit={handleRequestRegister}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={requestRegisterMutation.isPending}
              >
                {requestRegisterMutation.isPending ? "Creating..." : "Create Account"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <GoogleOAuthButton />

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/signIn"
                  className="text-primary hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyRegister}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={verifyRegisterMutation.isPending}
              >
                {verifyRegisterMutation.isPending ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
