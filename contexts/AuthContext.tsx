"use client";

/**
 * ============================================
 * AuthContext - 인증 상태 관리 컨텍스트
 * ============================================
 * 
 * 이 파일은 사용자 인증 상태를 관리합니다.
 * 
 * 현재 구현:
 * - 로컬스토리지 기반 세션 관리 (Mock)
 * - 하드코딩된 테스트 계정 (test/test)
 * 
 * 백엔드 연동 시 변경 필요:
 * - login(): API 호출로 변경 (POST /api/auth/login)
 * - logout(): 서버 세션 무효화 API 호출 추가
 * - updateUser(): PUT /api/users/me 엔드포인트 연동
 * - 토큰 기반 인증 (JWT) 도입 권장
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * 사용자 정보 인터페이스
 * 
 * @property id - 사용자 고유 ID (백엔드 DB의 user_id와 매핑)
 * @property name - 사용자 표시 이름
 * @property nickname - 닉네임 (프로필에서 수정 가능)
 */
interface User {
  id: string;
  name: string;
  nickname?: string;
}

/**
 * AuthContext 타입 정의
 */
interface AuthContextType {
  user: User | null;           // 현재 로그인된 사용자 정보
  isLoading: boolean;          // 세션 복원 중 여부
  login: (id: string, password: string) => Promise<boolean>;  // 로그인 함수
  logout: () => void;          // 로그아웃 함수
  updateUser: (data: Partial<User>) => void;  // 사용자 정보 업데이트
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - 인증 상태를 앱 전체에 제공
 * 
 * app/layout.tsx에서 최상위로 래핑되어 있습니다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 앱 시작 시 로컬스토리지에서 세션 복원
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser && savedUser !== "undefined") {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Auth restoration error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 로그인 처리
   * 
   * TODO: 백엔드 연동 시 API 호출로 변경
   * - POST /api/auth/login { id, password }
   * - 응답: { user: User, token: string }
   */
  const login = async (id: string, password: string): Promise<boolean> => {
    // [Mock] 하드코딩된 테스트 계정
    if (id === "test" && password === "test") {
      const userData: User = { id: "test", name: "Test User", nickname: "jjeom5" };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  /**
   * 로그아웃 처리
   * 
   * TODO: 백엔드 연동 시 서버 세션 무효화 API 추가
   * - POST /api/auth/logout
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    router.push("/login");
  };

  /**
   * 사용자 정보 업데이트 (프로필 수정)
   * 
   * TODO: 백엔드 연동 시 API 호출로 변경
   * - PUT /api/users/me { nickname, ... }
   */
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth 훅 - 컴포넌트에서 인증 상태 접근
 * 
 * 사용 예:
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
