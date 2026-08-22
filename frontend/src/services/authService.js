import apiClient from "./apiClient";

export const authService = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      if (response.data?.token) {
        localStorage.setItem("smartqueue_token", response.data.token);
        localStorage.setItem("smartqueue_user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // Mock Fallback for offline/prototype demonstration
      console.warn("Backend not reached, using mock auth response.");
      const mockUser = {
        id: "USR-001",
        email: credentials.email || credentials.staffId || "doctor@citygeneral.org",
        role: credentials.role || "doctor",
        name: credentials.role === "doctor" ? "Dr. Aris Thorne" : "Staff Sarah Jenkins"
      };
      const mockToken = "mock_jwt_token_smartqueue_2026";
      localStorage.setItem("smartqueue_token", mockToken);
      localStorage.setItem("smartqueue_user", JSON.stringify(mockUser));
      return { success: true, user: mockUser, token: mockToken };
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.warn("Backend not reached, returning mock registration success.");
      return {
        success: true,
        message: "Registration successful. Please log in with your credentials.",
        user: { ...userData, id: "USR-" + Math.floor(Math.random() * 1000) }
      };
    }
  },

  resetPassword: async (identifier) => {
    try {
      const response = await apiClient.post("/auth/reset-password", { identifier });
      return response.data;
    } catch (error) {
      console.warn("Backend not reached, mock reset link dispatched.");
      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${identifier}.`
      };
    }
  },

  logout: () => {
    localStorage.removeItem("smartqueue_token");
    localStorage.removeItem("smartqueue_user");
  },

  getCurrentUser: () => {
    const saved = localStorage.getItem("smartqueue_user");
    return saved ? JSON.parse(saved) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("smartqueue_token");
  }
};

export default authService;
