'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        // OAuth 콜백: Backend가 Set-Cookie(HttpOnly)로 토큰을 전달함
        // refreshUser()로 쿠키 기반 인증 확인 후 리다이렉트
        const syncAuth = async () => {
            try {
                await refreshUser();
                router.replace('/portfolio/asset');
            } catch (error) {
                console.error('인증 처리 중 오류 발생:', error);
                router.replace('/login?error=oauth_failed');
            }
        };

        syncAuth();
    }, [router, refreshUser]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-xl font-medium">인증 정보를 동기화 중입니다...</p>
                <p className="text-gray-400 mt-2">잠시만 기다려 주세요.</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <AuthCallbackContent />
        </Suspense>
    );
}
