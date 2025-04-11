import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext, UserContext } from "../App";
import { authService } from "../apiService";
import MessageNotification from "./MessageNotification";

const Navbar = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>Content Management & Authentication</div>
      
      {isAuthenticated ? (
        <div style={linksStyle}>
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          <Link to="/contents" style={linkStyle}>View Contents</Link>
          <Link to="/create" style={linkStyle}>Create Content</Link>
          
          {/* Message notification with unread count */}
          {currentUser && <MessageNotification userId={currentUser._id} />}
          
          <Link to="/profile" style={linkStyle}>Profile</Link>
          <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
        </div>
      ) : (
        <div style={linksStyle}>
          <Link to="/login" style={linkStyle}>Login</Link>
          <Link to="/register" style={linkStyle}>Register</Link>
        </div>
      )}
    </nav>
  );
};

// Inline styles
const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem",
  backgroundColor: "#4e54c8",
  color: "#fff",
  borderRadius: "8px",
};

const logoStyle = {
  fontSize: "1.2rem",
  fontWeight: "bold",
};

const linksStyle = {
  display: "flex",
  gap: "1rem",
  alignItems: "center",
};

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
};

const logoutButtonStyle = {
  backgroundColor: "transparent",
  border: "1px solid white",
  color: "white",
  padding: "0.3rem 0.8rem",
  borderRadius: "4px",
  cursor: "pointer",
};

export default Navbar;