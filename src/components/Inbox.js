import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { messageService } from '../messageService';
import axios from 'axios';

// Error Display Component
const ErrorDisplay = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div style={{
      backgroundColor: '#ffdddd',
      color: '#ff0000',
      padding: '15px',
      margin: '10px 0',
      borderRadius: '5px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{message}</span>
      <button 
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#ff0000',
          fontSize: '20px',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
    </div>
  );
};

const Inbox = () => {
  const navigate = useNavigate();

  // State Management
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Error Dismissal Handler
  const handleDismissError = () => {
    setError(null);
  };

  // Fetch User Data
  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch Current User Profile
      const userResponse = await axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUser = userResponse.data;
      setCurrentUserId(currentUser._id);

      // Fetch All Users
      const usersResponse = await axios.get('http://localhost:3000/api/user/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter Out Current User
      const filteredUsers = usersResponse.data.filter(user => user._id !== currentUser._id);
      setUsers(filteredUsers);

    } catch (fetchError) {
      console.error('User Data Fetch Error:', fetchError);
      
      // Detailed Error Handling
      if (fetchError.response) {
        switch (fetchError.response.status) {
          case 401:
            setError('Session expired. Please log in again.');
            navigate('/login');
            break;
          case 403:
            setError('You are not authorized to access this resource.');
            break;
          case 404:
            setError('User data not found.');
            break;
          default:
            setError('Failed to load user data. Please try again.');
        }
      } else if (fetchError.request) {
        setError('No response from server. Check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch Conversations
  const fetchConversations = useCallback(() => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      // Subscribe to Real-Time Conversations
      const unsubscribe = messageService.subscribeToUserConversations(
        currentUserId,
        (updatedConversations) => {
          // Sort Conversations by Last Message Timestamp
          const sortedConversations = updatedConversations.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.seconds || 0;
            const timeB = b.lastMessage?.timestamp?.seconds || 0;
            return timeB - timeA;
          });

          setConversations(sortedConversations);
          setLoading(false);
        }
      );

      // Return Unsubscribe Function
      return unsubscribe;
    } catch (subscribeError) {
      console.error('Conversation Subscription Error:', subscribeError);
      setError('Failed to load conversations. Please try again.');
      setLoading(false);
    }
  }, [currentUserId]);

  // Initial Data Fetch
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Conversations Subscription
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = fetchConversations();

    // Cleanup Subscription
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, fetchConversations]);

  // Create New Conversation
  const handleNewMessage = async () => {
    if (!selectedUser) {
      setError('Please select a user to message');
      return;
    }
    
    try {
      // Create or Get Existing Conversation
      const conversation = await messageService.createConversation(
        currentUserId, 
        selectedUser
      );

      // Navigate to Conversation
      navigate(`/messages/${conversation.id}`);
    } catch (createError) {
      console.error('Conversation Creation Error:', createError);
      
      // Specific Error Handling
      if (createError.code === 'permission-denied') {
        setError('You do not have permission to start this conversation');
      } else if (createError.code === 'invalid-input') {
        setError('Invalid user selection. Please try again.');
      } else {
        setError('Failed to create conversation. Please try again.');
      }
    }
  };

  // Format Timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get Other Participant's Name
  const getOtherParticipantName = (participants) => {
    if (!participants || !currentUserId) return 'Unknown';
    
    const otherUserId = participants.find(id => id !== currentUserId);
    if (!otherUserId) return 'Unknown';
    
    const user = users.find(u => u._id === otherUserId);
    return user ? user.username : 'Unknown';
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '30px auto', 
      backgroundColor: 'white', 
      borderRadius: '10px', 
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px', 
        borderBottom: '1px solid #eee' 
      }}>
        <h2 style={{ margin: 0 }}>Messages</h2>
        
        {/* New Message Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ddd' 
            }}
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
          
          <button 
            onClick={handleNewMessage}
            disabled={!selectedUser}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: selectedUser ? '#4e54c8' : '#cccccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: selectedUser ? 'pointer' : 'not-allowed' 
            }}
          >
            New Message
          </button>
        </div>
      </div>

      {/* Error Display */}
      <ErrorDisplay 
        message={error} 
        onDismiss={handleDismissError} 
      />

      {/* Conversations List */}
      <div>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '30px', 
            color: '#666' 
          }}>
            No conversations yet. Start a new message!
          </div>
        ) : (
          conversations.map(conversation => (
            <Link 
              key={conversation.id} 
              to={`/messages/${conversation.id}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit' 
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                borderBottom: '1px solid #eee',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* User Avatar */}
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: '#e0e0ff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '15px' 
                }}>
                  {getOtherParticipantName(conversation.participants)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                {/* Conversation Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'baseline' 
                  }}>
                    <h3 style={{ margin: 0 }}>
                      {getOtherParticipantName(conversation.participants)}
                    </h3>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      color: '#888' 
                    }}>
                      {conversation.lastMessage && 
                        formatTimestamp(conversation.lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: '5px 0 0', 
                    color: '#666', 
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis' 
                  }}>
                    {conversation.lastMessage?.senderId === currentUserId && "You: "}
                    {conversation.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Inbox;