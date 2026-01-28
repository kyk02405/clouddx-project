"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Validation Logic ---

// Password Validation Helper
const checkPasswordComplexity = (password: string) => {
    let score = 0;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
};

const registerSchema = z.object({
    email: z.string().email("유효한 이메일 주소를 입력해주세요."),
    password: z.string()
        .min(10, "비밀번호는 최소 10자 이상이어야 합니다.")
        .max(128, "비밀번호는 최대 128자까지 가능합니다.")
        .refine((val) => checkPasswordComplexity(val) >= 3, {
            message: "영문 대/소문자, 숫자, 특수문자 중 3종류 이상을 포함해야 합니다.",
        }),
    passwordConfirm: z.string(),
    nickname: z.string()
        .min(2, "닉네임은 최소 2자 이상이어야 합니다.")
        .max(20, "닉네임은 최대 20자까지 가능합니다.")
        .regex(/^[a-zA-Z0-9가-힣_]+$/, "한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다."),
    termsAccepted: z.literal(true, {
        errorMap: () => ({ message: "필수 약관에 동의해야 합니다." }),
    }),
    marketingOptIn: z.boolean().default(false),
}).refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
}).refine((data) => {
    // Password should not contain email ID part
    const emailId = data.email.split("@")[0];
    if (emailId && data.password.includes(emailId)) return false;
    return true;
}, {
    message: "아이디(이메일)를 포함한 비밀번호는 사용할 수 없습니다.",
    path: ["password"],
}).refine((data) => {
    // Password should not contain nickname
    if (data.nickname && data.password.includes(data.nickname)) return false;
    return true;
}, {
    message: "닉네임을 포함한 비밀번호는 사용할 수 없습니다.",
    path: ["password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [registringEmail, setRegistringEmail] = useState("");

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            passwordConfirm: "",
            nickname: "",
            termsAccepted: false,
            marketingOptIn: false,
        },
        mode: "onChange",
    });

    const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, watch } = form;

    // Watch fields for real-time password feedback
    const watchPassword = watch("password", "");
    const passLen = watchPassword.length >= 10 && watchPassword.length <= 128;
    const passComplex = checkPasswordComplexity(watchPassword) >= 3;
    const passMatch = watchPassword === watch("passwordConfirm", "") && watchPassword !== "";

    const onSubmit = async (data: RegisterFormValues) => {
        // Mock API Call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Registered Data:", data);
        setRegistringEmail(data.email);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
                <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 text-center p-6">
                    <CardHeader className="space-y-4">
                        <div className="mx-auto rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold">인증 메일 발송 완료</CardTitle>
                        <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
                            <span className="font-bold text-zinc-900 dark:text-white">{registringEmail}</span><br />
                            으로 인증 메일을 보냈습니다.<br />
                            메일함에서 인증 버튼을 눌러 가입을 완료해주세요.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3">
                        <Button
                            className="w-full h-11 text-base font-semibold"
                            onClick={() => router.push("/login")}
                        >
                            로그인 페이지로 이동
                        </Button>
                        <p className="text-xs text-zinc-500">
                            메일이 오지 않았나요? <span className="underline cursor-pointer hover:text-zinc-900 dark:hover:text-white">재발송하기</span>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
            <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-black p-3 dark:bg-white text-white dark:text-black">
                            <Shield className="h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
                    <CardDescription>
                        안전한 자산 관리를 시작해보세요
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">이메일 (아이디)</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                {...register("email")}
                                className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
                            />
                            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                        </div>

                        {/* Nickname */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="nickname">닉네임</Label>
                                <span className="text-xs text-zinc-400">2~20자, 중복 가능</span>
                            </div>
                            <Input
                                id="nickname"
                                placeholder="사용하실 닉네임을 입력하세요"
                                {...register("nickname")}
                                className={cn(errors.nickname && "border-red-500 focus-visible:ring-red-500")}
                            />
                            {errors.nickname && <p className="text-xs text-red-500 font-medium">{errors.nickname.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="비밀번호 입력"
                                {...register("password")}
                                className={cn(errors.password && "border-red-500 focus-visible:ring-red-500")}
                            />

                            {/* Password Rules Feedback */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 mt-2">
                                <div className={cn("flex items-center gap-1", passLen ? "text-emerald-600 font-medium" : "")}>
                                    {passLen ? <Check className="h-3 w-3" /> : <div className="h-1 w-1 rounded-full bg-zinc-300 mx-1" />}
                                    10자 이상
                                </div>
                                <div className={cn("flex items-center gap-1", passComplex ? "text-emerald-600 font-medium" : "")}>
                                    {passComplex ? <Check className="h-3 w-3" /> : <div className="h-1 w-1 rounded-full bg-zinc-300 mx-1" />}
                                    3종류 이상 조합
                                </div>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                        </div>

                        {/* Password Confirm */}
                        <div className="space-y-2">
                            <Label htmlFor="password-confirm">비밀번호 확인</Label>
                            <Input
                                id="password-confirm"
                                type="password"
                                placeholder="비밀번호 재입력"
                                {...register("passwordConfirm")}
                                className={cn(errors.passwordConfirm && "border-red-500 focus-visible:ring-red-500")}
                            />
                            {errors.passwordConfirm && <p className="text-xs text-red-500 font-medium">{errors.passwordConfirm.message}</p>}
                        </div>

                        {/* Terms */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-start space-x-2 rounded-md border p-4">
                                <Checkbox
                                    id="terms"
                                    onCheckedChange={(checked) => form.setValue("termsAccepted", checked === true, { shouldValidate: true })}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        서비스 이용약관 및 개인정보 처리방침 동의 (필수)
                                    </Label>
                                    <p className="text-xs text-zinc-500">
                                        서비스 이용을 위해 필수 약관에 동의가 필요합니다.
                                    </p>
                                    {errors.termsAccepted && <p className="text-xs text-red-500 font-medium mt-1">{errors.termsAccepted.message}</p>}
                                </div>
                            </div>
                            <div className="flex items-start space-x-2 rounded-md border p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Checkbox
                                    id="marketing"
                                    onCheckedChange={(checked) => form.setValue("marketingOptIn", checked === true)}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="marketing" className="text-sm font-medium leading-none">
                                        마케팅 정보 수신 동의 (선택)
                                    </Label>
                                    <p className="text-xs text-zinc-500">
                                        이벤트 및 혜택 정보를 받아보실 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 mt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold"
                            disabled={isSubmitting || !isValid}
                        >
                            {isSubmitting ? "계정 생성 중..." : "계정 만들기"}
                        </Button>
                        <div className="text-center text-sm">
                            <span className="text-zinc-500">이미 계정이 있으신가요? </span>
                            <Link href="/login" className="font-semibold text-zinc-900 dark:text-white hover:underline">
                                로그인
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
