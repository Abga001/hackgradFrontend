import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '../messageService';
import axios from 'axios';

// Custom error handling component
const ErrorDisplay = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div style={{
      backgroundColor: '#ffdddd',
      color: '#ff0000',
      padding: '15px',
      borderRadius: '5px',
      margin: '10px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <strong>Error: </strong>{error}
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '10px' }}>
            <summary>Technical Details</summary>
            <pre style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '10px', 
              borderRadius: '5px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
      <button 
        onClick={onDismiss}
        style={{
          backgroundColor: 'transparent',
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

const Conversation = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Fetch user and conversation data
  const fetchConversationData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch current user profile
      const userResponse = await axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUser = userResponse.data;
      setCurrentUserId(currentUser._id);

      // Get conversation details
      const convo = await messageService.getConversationById(conversationId);
      if (!convo) {
        throw new Error('Conversation not found');
      }
      setConversation(convo);

      // Find other participant
      const otherParticipantId = convo.participants.find(id => id !== currentUser._id);
      if (otherParticipantId) {
        try {
          const otherUserResponse = await axios.get(
            `http://localhost:3000/api/user/profile/${otherParticipantId}`, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setOtherUser(otherUserResponse.data);
        } catch (userError) {
          console.error('Error fetching other user:', userError);
          setError('Could not load conversation partner details');
        }
      }

      // Mark existing messages as read
      await messageService.markMessagesAsRead(conversationId, currentUser._id);

    } catch (fetchError) {
      console.error('Conversation Data Fetch Error:', fetchError);
      setError(fetchError.message || 'Failed to load conversation');
      setLoading(false);
    }
  }, [conversationId, navigate]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      // Unsubscribe from previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Subscribe to messages
      unsubscribeRef.current = messageService.subscribeToMessages(
        conversationId,
        async (updatedMessages) => {
          try {
            // Sort messages by timestamp
            const sortedMessages = updatedMessages.sort((a, b) => 
              (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
            );

            setMessages(sortedMessages);
            setLoading(false);

            // Mark messages as read
            await messageService.markMessagesAsRead(conversationId, currentUserId);
          } catch (readError) {
            console.error('Error processing messages:', readError);
            setError('Failed to process messages');
          }
        }
      );

      // Initial data fetch
      fetchConversationData();

      // Cleanup subscription on unmount
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (subscribeError) {
      console.error('Message Subscription Error:', subscribeError);
      setError('Could not subscribe to messages');
      setLoading(false);
    }
  }, [conversationId, currentUserId, fetchConversationData]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Message sending handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Trim and validate message
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) {
      setError('Message cannot be empty');
      return;
    }

    // Prevent sending while loading
    if (loading) return;

    try {
      // Send message
      await messageService.sendMessage(
        conversationId, 
        currentUserId, 
        trimmedMessage
      );

      // Clear input and error
      setNewMessage('');
      setError(null);
    } catch (sendError) {
      console.error('Message Send Error:', sendError);
      
      // User-friendly error handling
      let userMessage = 'Failed to send message. Please try again.';
      
      if (sendError.code === 'validation-error') {
        userMessage = 'Message is too long. Please shorten it.';
      } else if (sendError.code === 'not-found') {
        userMessage = 'Conversation no longer exists.';
      }

      setError(userMessage);
    }
  };

  // Error dismissal handler
  const handleDismissError = () => {
    setError(null);
  };

  // Message rendering helper
  const renderMessages = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}>
          Loading messages...
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#666' 
        }}>
          No messages yet. Start the conversation!
        </div>
      );
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
      const date = message.timestamp 
        ? new Date(message.timestamp.seconds * 1000).toDateString() 
        : 'Unknown Date';
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

    return Object.entries(groupedMessages).map(([date, dayMessages]) => (
      <div key={date}>
        <div style={{
          textAlign: 'center',
          margin: '10px 0',
          color: '#888',
          fontSize: '0.8rem'
        }}>
          {date}
        </div>
        {dayMessages.map((message) => (
          <div 
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.senderId === currentUserId 
                ? 'flex-end' 
                : 'flex-start',
              margin: '10px 0'
            }}
          >
            <div style={{
              maxWidth: '70%',
              backgroundColor: message.senderId === currentUserId 
                ? '#007bff' 
                : '#e9ecef',
              color: message.senderId === currentUserId 
                ? 'white' 
                : 'black',
              padding: '10px',
              borderRadius: '10px',
            }}>
              {message.text}
              <div style={{
                fontSize: '0.7rem',
                color: message.senderId === currentUserId 
                  ? 'rgba(255,255,255,0.7)' 
                  : 'rgba(0,0,0,0.5)',
                textAlign: 'right',
                marginTop: '5px'
              }}>
                {message.timestamp 
                  ? new Date(message.timestamp.seconds * 1000)
                    .toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                  : 'Just now'}
              </div>
            </div>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Conversation Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
        borderBottom: '1px solid #eee'
      }}>
        <button 
          onClick={() => navigate('/messages')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div style={{ marginLeft: '10px' }}>
          <h2>{otherUser?.username || 'Loading...'}</h2>
        </div>
      </div>

      {/* Error Display */}
      <ErrorDisplay 
        error={error} 
        onDismiss={handleDismissError} 
      />

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: '#f4f5f7'
      }}>
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          padding: '10px',
          borderTop: '1px solid #eee'
        }}
      >
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            marginRight: '10px'
          }}
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: newMessage.trim() && !loading 
              ? '#007bff' 
              : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: newMessage.trim() && !loading 
              ? 'pointer' 
              : 'not-allowed'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Conversation;