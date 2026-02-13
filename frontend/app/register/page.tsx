"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, Check } from "lucide-react";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email."),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .max(128, "Password must be at most 128 characters."),
    passwordConfirm: z.string(),
    nickname: z.string().min(2, "Nickname must be at least 2 characters.").max(20, "Nickname is too long."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match.",
    path: ["passwordConfirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      nickname: "",
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await fetch("/api/proxy/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nickname: data.nickname,
          marketing_opt_in: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData?.detail || "Registration failed.";
        setError("root", { message: detail });
        return;
      }

      setRegisteredEmail(data.email);
      setIsSubmitted(true);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Network error during registration.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 text-center p-6">
          <CardHeader className="space-y-4">
            <div className="mx-auto rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Check className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Registration complete</CardTitle>
            <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
              Your account <span className="font-bold text-zinc-900 dark:text-white">{registeredEmail}</span> is ready.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full h-11 text-base font-semibold" onClick={() => router.push("/login")}>
              Go to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/30">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create account</CardTitle>
          <CardDescription>Set up your Tutum account.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="nickname">
                Nickname
              </label>
              <Input id="nickname" type="text" {...register("nickname")} />
              {errors.nickname && <p className="text-xs text-rose-600">{errors.nickname.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="passwordConfirm">
                Confirm password
              </label>
              <Input id="passwordConfirm" type="password" {...register("passwordConfirm")} />
              {errors.passwordConfirm && <p className="text-xs text-rose-600">{errors.passwordConfirm.message}</p>}
            </div>

            {errors.root?.message && <p className="text-sm text-rose-600">{errors.root.message}</p>}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-11 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-zinc-500">Already have an account? </span>
              <Button variant="link" className="p-0 h-auto font-semibold text-zinc-900 dark:text-white" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <div className="flex justify-center mt-8">
        <Button
          variant="ghost"
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors flex items-center gap-2"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Button>
      </div>
    </div>
  );
}
