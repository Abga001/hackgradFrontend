import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ContentList from "./components/ContentList";
import CreateContent from "./components/CreateContent";
import Profile from "./components/Profile";
import ProfileEdit from "./components/ProfileEdit";
import Navbar from "./components/Navbar";
import Inbox from "./components/Inbox";
import Conversation from "./components/Conversation";
import { authenticateWithFirebase } from "./firebaseConfig";

// Create auth context for global state management
export const AuthContext = createContext();
export const UserContext = createContext();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is authenticated on initial load
  // In App.js, update the useEffect where you check authentication
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    
    if (token) {
      try {
        // Fetch user data
        const response = await fetch('http://localhost:3000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
          setIsAuthenticated(true);
          
          // Authenticate with Firebase after regular auth succeeds
          await authenticateWithFirebase();
        } else {
          // Token invalid
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  };
 
  checkAuth();
}, []);

  // Protected Route component
  const ProtectedRoute = ({ element }) => {
    if (isLoading) return <div>Loading...</div>;
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <UserContext.Provider value={{ currentUser, setCurrentUser }}>
        <Router>
          <div className="app-container">
            <Navbar />
            <div className="content-container">
              <Routes>
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
               
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/create" element={<ProtectedRoute element={<CreateContent />} />} />
                <Route path="/contents" element={<ProtectedRoute element={<ContentList />} />} />
                
                {/* Profile Routes */}
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="/profile/edit" element={<ProtectedRoute element={<ProfileEdit />} />} />
                
                {/* New Messaging Routes */}
                <Route path="/messages" element={<ProtectedRoute element={<Inbox />} />} />
                <Route path="/messages/:conversationId" element={<ProtectedRoute element={<Conversation />} />} />
               
                {/* Default route */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          </div>
        </Router>
      </UserContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
