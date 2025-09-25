import { useState } from "react";
import { verifySignIn } from "@/redux/actions/authAction";
import { requestSignIn } from "@/redux/apis/authRequest";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import Link from "next/link";
import { env } from "@/config/env";

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading: authLoading } = useAppSelector((state) => state.userReducer);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [form, setForm] = useState({ email: "", password: "", otp: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "request") {
      // Request OTP (call API directly)
      await requestSignIn(form.email);
      setStep("verify");
    } else {
      // Verify OTP and sign in (dispatch verifySignIn)
      await dispatch(verifySignIn({ email: form.email, password: form.password, otp: form.otp }));
      router.replace("/");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="max-w-sm overflow-y-scroll rounded-2xl bg-white p-5 text-center shadow-lg">
        <h2 className="my-2 text-3xl font-bold text-gray-900 md:text-3xl">
          <span className="font-quantum text-green-700">Sign In</span> to add new{" "}
          <span className="font-quantum text-emerald-600">Pockity</span>
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {step === "request" ? (
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded bg-gray-100 p-2"
              required
              autoFocus
            />
          ) : (
            <>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded bg-gray-100 p-2"
                required
                disabled
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded bg-gray-100 p-2"
                required
              />
              <input
                type="text"
                name="otp"
                placeholder="OTP"
                value={form.otp}
                onChange={handleChange}
                className="w-full rounded bg-gray-100 p-2"
                required
                maxLength={6}
              />
            </>
          )}
          <button
            type="submit"
            className="w-full rounded bg-[#19d347eb] p-2 text-white hover:bg-green-600"
          >
            {step === "request" ? "Request OTP" : authLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <Link
          href={`${env.NEXT_PUBLIC_SERVER_URL}/api/auth/oauth-url`}
          className="my-1 w-full rounded-md"
          type="button"
        >
          Sign In with Google
        </Link>
        <p className="mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signUp"
            className="text-green-500"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
