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
  const extendSession = useCallback(() => {
    if (!sessionExpiry) return;
    const newExpiry = Math.max(sessionExpiry, Date.now()) + 30 * 60 * 1000; // 현재 시간 또는 기존 만료 시간 기준 30분 추가
    setSessionExpiry(newExpiry);
    localStorage.setItem("session_expiry", newExpiry.toString());
  }, [sessionExpiry]);

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

        // 로컬 스토리지 업데이트
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("auth_token", authToken);
        
        // 세션 만료 시간 설정 (최초 로그인 또는 새로고침 시 기존 만료 시간 유지/없으면 1시간 설정)
        const savedExpiry = localStorage.getItem("session_expiry");
        if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
            setSessionExpiry(parseInt(savedExpiry));
        } else {
            // 초기 1시간 (60분)
            const newExpiry = Date.now() + 60 * 60 * 1000; 
            setSessionExpiry(newExpiry);
            localStorage.setItem("session_expiry", newExpiry.toString());
        }

        // 쿠키 설정 (로그인 상태 유지를 위해 24시간 설정 - 서버 측 세션과는 별개)
        document.cookie = `auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax`;

        return true;
      } else {
        console.error("Session expired or invalid");
        setUser(null);
        setToken(null);
        setSessionExpiry(null);
        localStorage.removeItem("user");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_expiry");
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return false;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return false;
    }
  }, [API_URL]);

  // 앱 시작 시 로컬스토리지에서 세션 복원
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("user");

        if (savedToken) {
          setToken(savedToken);
          // 세션 만료 시간 복원
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
          // 배경에서 사용자 정보 최신화 및 쿠키 갱신
          await fetchMe(savedToken);
        }
      } catch (e) {
        console.error("Auth restoration error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchMe]);

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
   * 로그아웃 처리
   */
  const logout = useCallback(async () => {
    try {
      // 1. Call backend logout to clear server-side cookies
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Backend logout failed:", error);
    }

    // 2. Clear frontend state
    setUser(null);
    setToken(null);
    setSessionExpiry(null);
    
    // 3. Clear storage
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("session_expiry");
    
    // 4. Clear cookie manually as a backup
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    
    // 5. Hard reload to home
    window.location.replace("/");
  }, [API_URL]);

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
    }, 1000); // Check every second for precise UI display support if needed

    return () => clearInterval(interval);
  }, [user, sessionExpiry, logout]);

  /**
   * 사용자 정보 업데이트
   */
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * 세션 강제 새로고침
   */
  const refreshUser = async () => {
    const savedToken = localStorage.getItem("auth_token");
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
