"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, SignUpInput } from "@/lib/validators/auth.schema";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUserDocument } from "@/lib/actions/auth.actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/my-polls";

  // Capture redirect result if popup was blocked and fallback redirect was used
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          setIsGoogleLoading(true);
          try {
            const user = result.user;
            // Upsert Firestore profile for Google users (set only if no doc yet)
            await createUserDocument(
              user.uid,
              user.email ?? "",
              user.displayName ?? user.email ?? "User"
            );
            await createSession(await user.getIdToken());
            toast.success(`Welcome, ${user.displayName || "there"}!`);
            router.push(redirectUrl);
            router.refresh();
          } catch (error: any) {
            toast.error(error.message || "Failed to establish session after redirect");
          } finally {
            setIsGoogleLoading(false);
          }
        }
      })
      .catch((error: any) => {
        if (error.code !== "auth/redirect-cancelled-by-user") {
          toast.error(error.message || "Google sign-up redirect failed");
        }
      });
  }, [router, redirectUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function createSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("Could not create session");
  }

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await updateProfile(cred.user, { displayName: data.name });
      const result = await createUserDocument(
        cred.user.uid,
        data.email,
        data.name
      );
      if (!result.success) throw new Error(result.error);
      await createSession(await cred.user.getIdToken());
      toast.success("Account created successfully!");
      router.push(redirectUrl);
      router.refresh();
    } catch (error: any) {
      toast.error(
        error.code === "auth/email-already-in-use"
          ? "An account with this email already exists"
          : error.message || "Failed to create account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      // Trigger the popup immediately in the user click gesture context
      const result = await signInWithPopup(auth, googleProvider);
      setIsGoogleLoading(true);
      const user = result.user;
      // Upsert Firestore profile for Google users (set only if no doc yet)
      await createUserDocument(
        user.uid,
        user.email ?? "",
        user.displayName ?? user.email ?? "User"
      );
      await createSession(await user.getIdToken());
      toast.success(`Welcome, ${user.displayName || "there"}!`);
      router.push(redirectUrl);
      router.refresh();
    } catch (error: any) {
      if (error.code === "auth/popup-blocked") {
        setIsGoogleLoading(true);
        toast.info("Popup blocked. Redirecting to Google Sign-Up...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          toast.error(redirectErr.message || "Redirect failed to initiate");
          setIsGoogleLoading(false);
        }
      } else if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Google sign-up failed");
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Google Sign-Up */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600 font-medium">or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* Email / Password form */}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
            Display Name
          </label>
          <input
            {...register("name")}
            autoComplete="name"
            placeholder="Your name"
            className="input"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 size={15} className="animate-spin" />}
          {isLoading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href={`/sign-in${
            redirectUrl !== "/my-polls"
              ? `?redirect=${encodeURIComponent(redirectUrl)}`
              : ""
          }`}
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}