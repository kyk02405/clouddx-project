'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        // StrictMode 등에서 중복 실행 방지
        if (processed.current) return;

        const token = searchParams.get('token');

        if (token) {
            processed.current = true;

            // 1. 토큰 및 쿠키 즉시 저장 (미들웨어 패스용)
            sessionStorage.setItem('auth_token', token);
            // 미들웨어가 즉시 인식할 수 있도록 쿠키 직접 설정 (Session Cookie로 변경)
            document.cookie = `auth_token=${token}; path=/; SameSite=Lax`;

            // 2. AuthContext 상태 업데이트 및 사용자 정보 동기화
            const syncAuth = async () => {
                try {
                    console.log('인증 정보 동기화 시작...');
                    await refreshUser();
                    console.log('로그인 성공 및 세션 복원 완료');

                    // 상태 반영을 위해 약간의 지연 후 리다이렉트 (선택 사항)
                    setTimeout(() => {
                        router.push('/portfolio/asset');
                    }, 100);
                } catch (error) {
                    console.error('인증 처리 중 오류 발생:', error);
                    router.push('/login');
                }
            };

            syncAuth();
        } else {
            console.error('인증 실패: 토큰이 없습니다.');
            router.push('/login');
        }
    }, [searchParams, router, refreshUser]);

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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
