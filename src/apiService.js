// apiService.js

import axios from 'axios';

// Use environment variable from GitHub secrets, fallback to production URL
const API_URL = process.env.REACT_APP_API_URL || 'https://hackgrad-evd0c6g9agehf9e5.canadacentral-01.azurewebsites.net/api';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_ENABLED = true; // Toggle for easy cache disabling during debugging

// Create a reusable axios instance for authentication requests
const authAxios = axios.create({
  baseURL: `${API_URL}/auth`,
  timeout: 10000,
});

// Create a reusable axios instance for authenticated requests
const apiAxios = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});



// Helper function for caching
const getFromCache = (cacheKey) => {
  if (!CACHE_ENABLED) return null;
  
  const cachedItem = localStorage.getItem(cacheKey);
  if (!cachedItem) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cachedItem);
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  } catch (e) {
    // If parsing fails, invalidate cache
    localStorage.removeItem(cacheKey);
  }
  
  return null;
};

// Helper function to save to cache
const saveToCache = (cacheKey, data) => {
  if (!CACHE_ENABLED) return;
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Caching failed, likely localStorage is full", e);
    // Attempt to clear old cache entries
    clearOldCacheEntries();
  }
};

// Helper to clear older cache entries if storage is full
const clearOldCacheEntries = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('cache_')) {
      keysToRemove.push(key);
    }
  }
  
  // Sort by age and remove oldest 50%
  const keysToKeep = keysToRemove.length / 2;
  keysToRemove.forEach((key, index) => {
    if (index >= keysToKeep) {
      localStorage.removeItem(key);
    }
  });
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Service - Complete updated version with route fixes and enhanced error handling
export const authService = {
  getApiUrl: () => {
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      computed_API_URL: API_URL,
      window_location: window.location.origin
    });
    return API_URL;
  },

  // Register new user - UPDATED ROUTE
  register: async (userData) => {
    try {
      console.log('Making registration request to:', `${API_URL}/auth/register`);
      console.log('Registration data:', {
        username: userData.username,
        email: userData.email,
        hasPassword: !!userData.password
      });
      
      const response = await api.post('/auth/register', userData);
      
      console.log('Registration response received:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        headers: error.config?.headers,
        code: error.code
      });
      
      // Provide more specific error messages
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.response?.status === 400) {
        const serverMessage = error.response?.data?.message || 'Invalid registration data';
        throw new Error(serverMessage);
      } else if (error.response?.status === 409) {
        throw new Error('An account with this email already exists.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message.includes('CORS')) {
        throw new Error('Connection blocked by security policy. Please contact support.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Registration failed');
      }
    }
  },

  // Login user - UPDATED ROUTE
  login: async (credentials) => {
    try {
      console.log('Making login request to:', `${API_URL}/auth/login`);
      console.log('Request config:', {
        baseURL: API_URL,
        url: '/auth/login',
        method: 'POST',
        headers: api.defaults.headers,
        credentials: {
          email: credentials.email,
          hasPassword: !!credentials.password
        }
      });
      
      const response = await api.post('/auth/login', credentials);
      
      console.log('Login response received:', {
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        tokenLength: response.data.token ? response.data.token.length : 0
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token saved to localStorage');
        return response.data; // Return the full response data including user info
      }
      
      throw new Error('No token received from server');
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        headers: error.config?.headers,
        code: error.code,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password.');
      } else if (error.response?.status === 400) {
        const serverMessage = error.response?.data?.message || 'Invalid login credentials';
        throw new Error(serverMessage);
      } else if (error.response?.status === 404) {
        throw new Error('Login service not found. Please contact support.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message.includes('CORS')) {
        throw new Error('Connection blocked by security policy. Please contact support.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Login failed');
      }
    }
  },

  // Logout user
  logout: () => {
    console.log('Logging out user - clearing localStorage');
    // Clear all app data including cached items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_') || key === 'token') {
        localStorage.removeItem(key);
      }
    });
    console.log('localStorage cleared');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const hasToken = token !== null;
    console.log('Authentication check:', { 
      hasToken, 
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
    });
    return hasToken;
  },

  // Get current user data with caching
  getCurrentUser: async () => {
    const cacheKey = 'cache_current_user';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached user data:', {
        userId: cachedData._id,
        username: cachedData.username
      });
      return cachedData;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot get current user');
        return null;
      }

      console.log('Fetching current user profile from API:', `${API_URL}/user/profile`);
      const response = await api.get('/user/profile');
      const userData = response.data;
      
      console.log('User profile fetched successfully:', {
        userId: userData._id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName
      });
      
      // Cache the user data
      saveToCache(cacheKey, userData);
      
      return userData;
    } catch (error) {
      console.error("Get current user error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        code: error.code
      });
      
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        console.log('Token appears to be invalid, clearing localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem(cacheKey);
      }
      
      throw error;
    }
  },

  // Get Firebase token for chat - ROUTE STAYS THE SAME (in userRoutes)
  getFirebaseToken: async () => {
    try {
      console.log('Fetching Firebase token from:', `${API_URL}/user/firebase-token`);
      const response = await api.get('/user/firebase-token');
      
      console.log('Firebase token received:', {
        hasToken: !!response.data.firebaseToken,
        tokenLength: response.data.firebaseToken ? response.data.firebaseToken.length : 0
      });
      
      return response.data.firebaseToken;
    } catch (error) {
      console.error("Get Firebase token error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        code: error.code
      });
      throw error;
    }
  }
};

// User Service
export const userService = {
  // Get user profile by ID with caching
  getUserProfile: async (userId) => {
    const cacheKey = `cache_user_profile_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/user/profile/${userId}`);
      const userData = response.data;
      
      // Cache the profile data
      saveToCache(cacheKey, userData);
      
      return userData;
    } catch (error) {
      console.error("Get user profile error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get user followers
  getUserFollowers: async (userId) => {
    const cacheKey = `cache_user_followers_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/user/followers/${userId}`);
      const followers = response.data;
      
      // Cache the followers data
      saveToCache(cacheKey, followers);
      
      return followers;
    } catch (error) {
      console.error("Get user followers error:", error.response?.data || error.message);
      return [];
    }
  },

  // Follow a user (invalidates caches)
  followUser: async (userId) => {
    try {
      const response = await api.post(`/user/follow/${userId}`, {});
      
      // Invalidate relevant caches
      localStorage.removeItem(`cache_user_followers_${userId}`);
      localStorage.removeItem('cache_current_user');
      localStorage.removeItem('cache_user_following');
      
      return response.data;
    } catch (error) {
      console.error("Follow user error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Unfollow a user (invalidates caches)
  unfollowUser: async (userId) => {
    try {
      const response = await api.post(`/user/unfollow/${userId}`, {});
      
      // Invalidate relevant caches
      localStorage.removeItem(`cache_user_followers_${userId}`);
      localStorage.removeItem('cache_current_user');
      localStorage.removeItem('cache_user_following');
      
      return response.data;
    } catch (error) {
      console.error("Unfollow user error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's following list with caching
  getFollowing: async () => {
    const cacheKey = 'cache_user_following';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get('/user/following');
      const following = response.data;
      
      // Cache the following data
      saveToCache(cacheKey, following);
      
      return following;
    } catch (error) {
      console.error("Get following error:", error.response?.data || error.message);
      return [];
    }
  },



  // Get user's following list with caching
  getUserFollowing: async (userId) => {
    const cacheKey = `cache_user_following_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/user/following/${userId}`);
      const following = response.data;
      
      // Cache the following data
      saveToCache(cacheKey, following);
      
      return following;
    } catch (error) {
      console.error(`Get following for user ${userId} error:`, error.response?.data || error.message);
      return [];
    }
  },
  
  // Update user profile (invalidates caches)
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      
      // Invalidate user cache
      localStorage.removeItem('cache_current_user');
      
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Upload profile image
  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post('/user/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Invalidate user cache
      localStorage.removeItem('cache_current_user');
      
      return response.data;
    } catch (error) {
      console.error("Upload profile image error:", error.response?.data || error.message);
      throw error;
    }
  }
};

// Content Service
export const contentService = {
  // Create new content
  createContent: async (contentData) => {
    try {
      let response;
      
      if (contentData instanceof FormData) {
        // For FormData, let Axios set the proper Content-Type with boundary
        response = await api.post('/contents', contentData);
      } else {
        // For JSON data
        response = await api.post('/contents', contentData, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Invalidate content list cache
      localStorage.removeItem('cache_contents');
      
      return response.data;
    } catch (error) {
      console.error("Create content error:", error.response?.data || error.message);
      throw error;
    }
  },

    // Get user's posts/content with caching
    getUserPosts: async (userId, page = 1, limit = 10) => {
      const cacheKey = `cache_user_posts_${userId}_page${page}_limit${limit}`;
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      try {
        const response = await api.get(`/contents/user/${userId}?page=${page}&limit=${limit}`);
        
        // Cache the user posts data
        saveToCache(cacheKey, response.data);
        
        return response.data;
      } catch (error) {
        console.error("Get user posts error:", error.response?.data || error.message);
        return [];
      }
    },  

  // Get all contents with pagination
  getAllContents: async (page = 1, limit = 10) => {
    const cacheKey = `cache_contents_page${page}_limit${limit}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/contents?page=${page}&limit=${limit}`);
      const contents = response.data.contents || [];
      
      // Cache the paginated content data
      saveToCache(cacheKey, contents);
      
      return contents;
    } catch (error) {
      console.error("Get contents error:", error.response?.data || error.message);
      return [];
    }
  },

  // Get content by ID with caching
  getContentById: async (contentId) => {
    const cacheKey = `cache_content_${contentId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/contents/${contentId}`);
      
      // Cache the content data
      saveToCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error("Get content error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Update content (invalidates caches)
  updateContent: async (contentId, updateData) => {
    try {
      let response;
      
      if (updateData instanceof FormData) {
        // For FormData, let Axios set the proper Content-Type with boundary
        response = await api.patch(`/contents/${contentId}`, updateData);
      } else {
        // For JSON data
        response = await api.patch(`/contents/${contentId}`, updateData);
      }
      
      // Invalidate content caches
      localStorage.removeItem(`cache_content_${contentId}`);
      localStorage.removeItem('cache_contents');
      
      return response.data;
    } catch (error) {
      console.error("Update content error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Save content
  saveContent: async (contentId) => {
    try {
      const response = await api.post(`/contents/${contentId}/save`, {});
      
      // Invalidate content cache
      localStorage.removeItem(`cache_content_${contentId}`);
      
      return response.data;
    } catch (error) {
      console.error("Save content error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Repost content
  repostContent: async (contentId, repostNote = "") => {
    try {
      const response = await api.post(`/contents/${contentId}/repost`, { repostNote });
      
      // Invalidate content and contents caches
      localStorage.removeItem(`cache_content_${contentId}`);
      localStorage.removeItem('cache_contents');
      
      return response.data;
    } catch (error) {
      console.error("Repost content error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get saved content
  getSavedContent: async () => {
    const cacheKey = 'cache_saved_content';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get('/contents/saved');
      
      // Cache the saved content data
      saveToCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error("Get saved content error:", error.response?.data || error.message);
      return [];
    }
  },
  
  // Get reposted content
  getRepostedContent: async () => {
    const cacheKey = 'cache_reposted_content';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get('/contents/reposted');
      
      // Cache the reposted content data
      saveToCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error("Get reposted content error:", error.response?.data || error.message);
      return [];
    }
  },

    // Add an answer to a question
    addAnswer: async (contentId, answerText) => {
      try {
        const response = await api.post(`/contents/questions/${contentId}/answer`, { text: answerText });
        
        // Invalidate content cache
        localStorage.removeItem(`cache_content_${contentId}`);
        
        return response.data;
      } catch (error) {
        console.error("Add answer error:", error.response?.data || error.message);
        throw error;
      }
    },
    // Accept an answer for a question
    acceptAnswer: async (contentId, commentIndex) => {
      try {
        const response = await api.post(`/contents/questions/${contentId}/accept-answer`, { commentIndex });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to accept answer');
      }
    },
  
    // Vote on an answer
    voteAnswer: async (contentId, commentIndex, direction) => {
      try {
        const response = await api.post(`/contents/questions/${contentId}/vote-answer`, {
          commentIndex,
          direction
        });
        return response.data;
      } catch (error) {
        if (error.response?.status === 400) {
          // Handle specific error for already voted
          if (error.response.data.message.includes("already")) {
            return { error: "already-voted", message: error.response.data.message };
          }
        }
        throw new Error(error.response?.data?.message || 'Failed to vote on answer');
      }
    },


  // Add comment to content (invalidates caches)
  addComment: async (contentId, commentText) => {
    try {
      const response = await api.post(`/contents/${contentId}/comment`, { text: commentText });
      
      // Invalidate content cache
      localStorage.removeItem(`cache_content_${contentId}`);
      
      return response.data;
    } catch (error) {
      console.error("Add comment error:", error.response?.data || error.message);
      throw error;
    }
  },

    // Delete content (invalidates caches)
    deleteContent: async (contentId) => {
      try {
        const response = await api.delete(`/contents/${contentId}`);
        
        // Invalidate content caches
        localStorage.removeItem(`cache_content_${contentId}`);
        localStorage.removeItem('cache_contents');
        
        return response.data;
      } catch (error) {
        console.error("Delete content error:", error.response?.data || error.message);
        throw error;
      }
    },

    // Like/Dislike content (invalidates caches)
performAction: async (contentId, action) => {
  try {
    const response = await api.post(`/contents/${contentId}/${action}`, {});
    
    // Invalidate content cache
    localStorage.removeItem(`cache_content_${contentId}`);
    
    // Also invalidate user profile cache for content owner
    if (response.data.content && response.data.content.userId) {
      localStorage.removeItem(`cache_user_profile_${response.data.content.userId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`${action} content error:`, error.response?.data || error.message);
    throw error;
  }
}
};

// Search Service
export const searchService = {
  // Search for users and content
  search: async (query) => {
    // Don't cache search results as they're likely to change
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Search error:", error.response?.data || error.message);
      return { users: [], contents: [] };
    }
  }
};

// Message Service
export const messageService = {
  // Get conversations
  getConversations: async () => {
    try {
      const response = await api.get('/messages');
      return response.data;
    } catch (error) {
      console.error("Get conversations error:", error.response?.data || error.message);
      return [];
    }
  },

  // Get conversation messages
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/messages/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error("Get conversation error:", error.response?.data || error.message);
      return { messages: [] };
    }
  },

  // Send message
  sendMessage: async (conversationId, messageText) => {
    try {
      const response = await api.post(`/messages/${conversationId}`, { text: messageText });
      return response.data;
    } catch (error) {
      console.error("Send message error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Start new conversation
  startConversation: async (recipientId, initialMessage) => {
    try {
      const response = await api.post('/messages/new', { recipientId, message: initialMessage });
      return response.data;
    } catch (error) {
      console.error("Start conversation error:", error.response?.data || error.message);
      throw error;
    }
  }
};

