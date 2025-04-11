import axios from "axios";

// Base URL for API requests
const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors - automatically log out
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/user/login", credentials);
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post("/user/register", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  },
  
  logout: () => {
    localStorage.removeItem("token");
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
  
  // Firebase token function in the correct location
  getFirebaseToken: async () => {
    try {
      const response = await apiClient.get('/user/firebase-token');
      return response.data.firebaseToken;
    } catch (error) {
      console.error("Error getting Firebase token:", error);
      throw error.response?.data || { message: 'Failed to get Firebase token' };
    }
  }
};

// Content services
export const contentService = {
  getAllContents: async () => {
    try {
      const response = await apiClient.get("/contents");
      return response.data.contents;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch contents" };
    }
  },
  
  getContentById: async (id) => {
    try {
      const response = await apiClient.get(`/contents/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch content" };
    }
  },
  
  getContentsByType: async (type) => {
    try {
      const response = await apiClient.get(`/contents/type/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch contents by type" };
    }
  },
  
  createContent: async (contentData) => {
    try {
      const response = await apiClient.post("/contents", contentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create content" };
    }
  },
  
  updateContent: async (id, contentData) => {
    try {
      const response = await apiClient.patch(`/contents/${id}`, contentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update content" };
    }
  },
  
  deleteContent: async (id) => {
    try {
      const response = await apiClient.delete(`/contents/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete content" };
    }
  },
  
  likeContent: async (id) => {
    try {
      const response = await apiClient.post(`/contents/${id}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to like content" };
    }
  },
  
  dislikeContent: async (id) => {
    try {
      const response = await apiClient.post(`/contents/${id}/dislike`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to dislike content" };
    }
  },
  
  addComment: async (id, commentText) => {
    try {
      const response = await apiClient.post(`/contents/${id}/comment`, { text: commentText });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to add comment" };
    }
  }
};