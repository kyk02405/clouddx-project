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
  login: (email: string, password: string) => Promise<{ success: boolean; isUnverified?: boolean; error?: string }>;
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
    sessionStorage.setItem("session_expiry", newExpiry.toString());
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

        // sessionStorage 업데이트 (브라우저 종료시 만료)
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("auth_token", authToken);
        
        // 세션 만료 시간 설정
        const savedExpiry = sessionStorage.getItem("session_expiry");
        if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
            setSessionExpiry(parseInt(savedExpiry));
        } else {
            // 초기 2시간 (120분)
            const newExpiry = Date.now() + 120 * 60 * 1000; 
            setSessionExpiry(newExpiry);
            sessionStorage.setItem("session_expiry", newExpiry.toString());
        }

        // 쿠키 설정 (브라우저 종료 시 삭제되는 Session Cookie로 변경: max-age/expires 제거)
        document.cookie = `auth_token=${authToken}; path=/; SameSite=Lax`;

        return true;
      } else {
        console.error("Session expired or invalid");
        setUser(null);
        setToken(null);
        setSessionExpiry(null);
        sessionStorage.clear();
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
        const savedToken = sessionStorage.getItem("auth_token");
        const savedUser = sessionStorage.getItem("user");

        if (savedToken) {
          setToken(savedToken);
          // 세션 만료 시간 복원
          const savedExpiry = sessionStorage.getItem("session_expiry");
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
  const login = async (email: string, password: string): Promise<{ success: boolean; isUnverified?: boolean; error?: string }> => {
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
        const success = await fetchMe(access_token);
        return { success };
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData.detail);
        return { 
          success: false, 
          isUnverified: response.status === 403,
          error: errorData.detail || "로그인 실패"
        };
      }
    } catch (error) {
      console.error("Login API Error:", error);
      return { success: false, error: "서버 통신 중 오류가 발생했습니다." };
    }
  };

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async () => {
    try {
      // 1. Backend logout
      if (token) {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Backend logout failed:", error);
    }

    // 2. Clear frontend state FIRST
    setUser(null);
    setToken(null);
    setSessionExpiry(null);
    
    // 3. Purge all possible storages
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("session_expiry");
    localStorage.removeItem("saved_user"); // Check for any other variations
    
    // 4. Force clear all cookies
    const cookieNames = ["auth_token", "session_id"];
    const domains = [window.location.hostname, "." + window.location.hostname];
    const paths = ["/", "/auth"];
    
    cookieNames.forEach(name => {
      paths.forEach(path => {
        // Direct
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
        
        // Domain specific
        domains.forEach(domain => {
          document.cookie = `${name}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        });
      });
    });
    
    // 5. Hard redirection to home to reset all contexts
    window.location.href = "/";
  }, [API_URL, token]);

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
    }, 60000); // Check every 60 seconds

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
