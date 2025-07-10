import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, type User } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateStatus: (status: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user/me"],
    enabled: authService.isAuthenticated() && isInitialized,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.login(email, password);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      displayName 
    }: { 
      email: string; 
      password: string; 
      displayName: string; 
    }) => {
      return await authService.register(email, password, displayName);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest("PUT", "/api/user/me", updates);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user/me"], updatedUser);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PUT", "/api/user/status", { status });
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user/me"], (old: any) => ({
        ...old,
        status: updatedUser.status,
        lastSeen: updatedUser.lastSeen,
      }));
    },
  });

  const heartbeatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/heartbeat");
      return await response.json();
    },
  });

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Start heartbeat when user is authenticated
  useEffect(() => {
    if (user && authService.isAuthenticated()) {
      // Send heartbeat every 30 seconds to maintain online status
      heartbeatInterval.current = setInterval(() => {
        heartbeatMutation.mutate();
      }, 30000);

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          updateStatusMutation.mutate("away");
        } else {
          updateStatusMutation.mutate("online");
        }
      };

      // Handle beforeunload to set offline status
      const handleBeforeUnload = () => {
        // Use sendBeacon for reliable offline status update
        const data = JSON.stringify({ status: "offline" });
        navigator.sendBeacon("/api/user/status", data);
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [user, heartbeatMutation, updateStatusMutation]);

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, displayName: string) => {
    await registerMutation.mutateAsync({ email, password, displayName });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateUser = async (updates: Partial<User>) => {
    await updateUserMutation.mutateAsync(updates);
  };

  const updateStatus = async (status: string) => {
    await updateStatusMutation.mutateAsync(status);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
        login,
        register,
        logout,
        updateUser,
        updateStatus,
      }}
    >
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
