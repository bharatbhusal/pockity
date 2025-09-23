import { useState } from "react";
import { z } from "zod";
import { verifySignUp } from "@/redux/actions/authAction";
import { requestSignUp } from "@/redux/apis/authRequest";
import { useAppDispatch } from "@/redux/store";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function SignUpPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [form, setForm] = useState({ email: "", username: "", password: "", otp: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "request") {
      // Request OTP (call API directly)
      await requestSignUp(form.email);
      setStep("verify");
    } else {
      // Validate username/password
      const validationResult = signUpSchema.safeParse({ username: form.username, password: form.password });
      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }
      // Verify OTP and sign up (dispatch verifySignUp)
      await dispatch(
        verifySignUp({ email: form.email, username: form.username, password: form.password, otp: form.otp }),
      );
      router.replace("/auth/signIn");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-fit max-w-sm overflow-y-scroll rounded-2xl bg-white p-5 text-center shadow-lg">
        <h2 className="my-2 text-3xl font-bold text-gray-900 md:text-3xl">
          <span className="font-quantum text-green-700">Sign Up</span> to add new{" "}
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
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded bg-gray-100 p-2"
                required
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
            className="w-full rounded bg-[#19d347eb] p-2 text-white hover:bg-green-600 "
          >
            {step === "request" ? "Request OTP" : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link
            href="/auth/signIn"
            className="text-green-500"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
