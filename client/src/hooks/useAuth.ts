import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  membershipStatus: string;
  membershipType?: string;
  joinDate?: string;
  annualFee?: string;
  nextPaymentDate?: string;
  isAdmin: boolean;
  createdAt?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all query cache
      queryClient.clear();
      // Reset auth user data
      queryClient.setQueryData(["/api/auth/user"], null);
      // Force navigation after a brief delay to ensure session is cleared
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout: logoutMutation.mutate,
  };
}
