"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * 사용자 정보 인터페이스
 */
interface User {
  id: string;
  email: string;
  nickname: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
  marketing_opt_in?: boolean;
  login_type?: string;
}

/**
 * AuthContext 타입 정의
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  sessionExpiry: number | null;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /**
   * 세션 연장 (30분 추가)
   */
  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async () => {
    try {
      // 1. Call backend logout to clear server-side cookies
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (error) {
      console.error("Backend logout failed:", error);
    }

    // 2. Clear frontend state
    setUser(null);
    setToken(null);
    setSessionExpiry(null);
    
    // 3. Clear storage (Clear both for safety)
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("session_expiry");
    
    // 4. Clear cookie manually with all possible variations (Path, Domain, SameSite)
    const cookieNames = ["auth_token"];
    cookieNames.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      // Also clear domain-specific if any
      const domain = window.location.hostname;
      document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    });
    
    // 5. Hard reload to home
    window.location.replace("/");
  }, [API_URL, token]);

  const extendSession = useCallback(() => {
    if (!sessionExpiry) return;
    const newExpiry = Math.max(sessionExpiry, Date.now()) + 30 * 60 * 1000; // 현재 시간 또는 기존 만료 시간 기준 30분 추가
    setSessionExpiry(newExpiry);
    sessionStorage.setItem("session_expiry", newExpiry.toString());
  }, [sessionExpiry]);

  /**
   * 쿠키 가져오기 헬퍼
   */
  const getCookie = useCallback((name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  }, []);

  // 사용자 정보 가져오기 함수 (토큰이 있을 때 호출)
  const fetchMe = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(authToken);

        // sessionStorage 업데이트 (현재 탭)
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("auth_token", authToken);
        
        // 세션 만료 시간 설정 (localStorage에 저장하여 탭 간 공유)
        const savedExpiry = localStorage.getItem("session_expiry");
        if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
            setSessionExpiry(parseInt(savedExpiry));
        } else {
            // 엄격한 2시간 (120분)
            const newExpiry = Date.now() + 120 * 60 * 1000; 
            setSessionExpiry(newExpiry);
            localStorage.setItem("session_expiry", newExpiry.toString());
        }

        // 쿠키 설정 (브라우저 종료 시 삭제되는 Session Cookie)
        document.cookie = `auth_token=${authToken}; path=/; SameSite=Lax`;

        return true;
      } else {
        console.error("Session expired or invalid");
        logout();
        return false;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return false;
    }
  }, [API_URL, logout]);

  // 앱 시작 시 세선 복원
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. sessionStorage 확인 (현재 탭)
        let savedToken = sessionStorage.getItem("auth_token");
        let savedUser = sessionStorage.getItem("user");

        // 2. sessionStorage에 없으면 쿠키 확인 (다른 탭에서 로그인한 경우)
        if (!savedToken) {
            savedToken = getCookie("auth_token") || null;
        }

        if (savedToken) {
          setToken(savedToken);
          
          // 세션 만료 시간 복원 (localStorage)
          const savedExpiry = localStorage.getItem("session_expiry");
          if (savedExpiry) {
             setSessionExpiry(parseInt(savedExpiry));
          }

          if (savedUser && savedUser !== "undefined") {
            try {
              setUser(JSON.parse(savedUser));
            } catch (e) {
              console.error("User JSON parse error", e);
            }
          }
          
          // 사용자 정보 최신화 (토큰 유효성 검증 포함)
          await fetchMe(savedToken);
        }
      } catch (e) {
        console.error("Auth restoration error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchMe, getCookie]);

  /**
   * 로그인 처리
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;

        // 정보 업데이트 및 쿠키 설정 (fetchMe 내부에서 수행)
        return await fetchMe(access_token);
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData.detail);
        return false;
      }
    } catch (error) {
      console.error("Login API Error:", error);
      return false;
    }
  };


  /**
   * Session Expiry Check
   */
  useEffect(() => {
    if (!user || !sessionExpiry) return;

    const interval = setInterval(() => {
      if (Date.now() > sessionExpiry) {
        console.warn("Session timed out");
        logout();
      }
    }, 60000); // Check every minute to reduce unnecessary CPU usage

    return () => clearInterval(interval);
  }, [user, sessionExpiry, logout]);

  /**
   * 사용자 정보 업데이트
   */
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      sessionStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * 세션 강제 새로고침
   */
  const refreshUser = async () => {
    const savedToken = sessionStorage.getItem("auth_token");
    if (savedToken) {
      await fetchMe(savedToken);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sessionExpiry, login, logout, updateUser, refreshUser, extendSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
