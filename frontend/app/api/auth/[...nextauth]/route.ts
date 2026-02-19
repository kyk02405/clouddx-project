import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID || "",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
        }),
        NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID || "",
            clientSecret: process.env.NAVER_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return false;

            try {
                const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8000";
                const response = await fetch(`${apiBaseUrl}/api/v1/auth/social-sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: user.email,
                        nickname: user.name || user.email.split("@")[0],
                        provider: account?.provider,
                        provider_id: account?.providerAccountId,
                    }),
                });

                if (response.ok) {
                    // 백엔드에서 발급한 쿠키(Set-Cookie)는 이 서버사이드 fetch에서는 
                    // 브라우저로 직접 전달되지 않음. 
                    // 필요하다면 여기서 토큰을 추출해 session/jwt에 저장 가능.
                    return true;
                }
                return false;
            } catch (error) {
                console.error("[NextAuth] Social sync failed:", error);
                return false;
            }
        },
        async jwt({ token, account, user }) {
            if (account && user) {
                token.accessToken = account.access_token;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
