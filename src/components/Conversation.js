import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '../messageService';
import axios from 'axios';

const Conversation = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch user data and conversation details on initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get current user profile
        const response = await axios.get('http://localhost:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserId(response.data._id);

        // Get conversation details
        const convo = await messageService.getConversationById(conversationId);
        if (!convo) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }
        setConversation(convo);

        // Get other participant's details
        const otherParticipantId = convo.participants.find(id => id !== response.data._id);
        if (otherParticipantId) {
          try {
            const otherUserResponse = await axios.get(`http://localhost:3000/api/user/profile/${otherParticipantId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setOtherUser(otherUserResponse.data);
          } catch (err) {
            console.error('Error fetching other user details:', err);
          }
        }

        // Mark messages as read
        await messageService.markMessagesAsRead(conversationId, response.data._id);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load conversation. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, navigate]);

  // Subscribe to messages for real-time updates
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    setLoading(true);
    
    try {
      // Subscribe to messages
      const unsubscribe = messageService.subscribeToMessages(
        conversationId,
        async (updatedMessages) => {
          setMessages(updatedMessages);
          setLoading(false);
          
          // Mark messages as read whenever new messages arrive
          await messageService.markMessagesAsRead(conversationId, currentUserId);
        }
      );

      // Cleanup subscription on component unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error subscribing to messages:', err);
      setError('Failed to load messages. Please try again.');
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !conversationId) return;

    try {
      await messageService.sendMessage(conversationId, currentUserId, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // Format timestamp to display time or date
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for day separators
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  // Group messages by date for day separators
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      if (!message.timestamp) return;
      
      const date = message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
      const dateString = date.toDateString();
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      
      groups[dateString].push(message);
    });
    
    return groups;
  };

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '30px auto', 
      backgroundColor: 'white', 
      borderRadius: '10px', 
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 180px)'
    }}>
      {/* Conversation Header */}
      <div style={{ 
        padding: '15px 20px', 
        borderBottom: '1px solid #eee', 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
      }}>
        <button 
          onClick={() => navigate('/messages')}
          style={{ 
            marginRight: '15px', 
            background: 'none', 
            border: 'none', 
            fontSize: '1.2rem', 
            cursor: 'pointer',
            color: '#555'
          }}
        >
          ←
        </button>
        {otherUser ? (
          <>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: '#e0e0ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginRight: '15px', 
              fontSize: '18px', 
              fontWeight: 'bold' 
            }}>
              {otherUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{otherUser.username}</h3>
              {otherUser.fullName && <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{otherUser.fullName}</p>}
            </div>
          </>
        ) : (
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Loading...</h3>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{ padding: '15px', margin: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Messages Container */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px', 
        backgroundColor: '#f5f7fb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            padding: '30px', 
            textAlign: 'center', 
            color: '#666',
            marginTop: 'auto',
            marginBottom: 'auto'
          }}>
            <p>No messages yet.</p>
            <p>Send a message to start the conversation!</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupMessagesByDate()).map(([dateString, dateMessages]) => (
              <div key={dateString}>
                <div style={{ 
                  textAlign: 'center', 
                  margin: '20px 0', 
                  position: 'relative' 
                }}>
                  <span style={{ 
                    backgroundColor: 'rgba(0,0,0,0.1)', 
                    borderRadius: '15px', 
                    padding: '4px 12px', 
                    fontSize: '0.8rem',
                    color: '#555' 
                  }}>
                    {formatMessageDate(dateMessages[0].timestamp)}
                  </span>
                </div>
                
                {dateMessages.map((message, index) => (
                  <div key={message.id} style={{ 
                    display: 'flex',
                    justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div style={{ 
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: message.senderId === currentUserId 
                        ? '18px 18px 0 18px' 
                        : '18px 18px 18px 0',
                      backgroundColor: message.senderId === currentUserId ? '#007bff' : 'white',
                      color: message.senderId === currentUserId ? 'white' : 'black',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ margin: 0 }}>{message.text}</p>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        marginTop: '5px',
                        textAlign: 'right',
                        opacity: 0.7
                      }}>
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        style={{ 
          padding: '15px', 
          borderTop: '1px solid #eee',
          display: 'flex', 
          backgroundColor: 'white'
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ 
            flex: 1,
            padding: '12px 15px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            marginRight: '10px',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{ 
            padding: '0 20px',
            backgroundColor: !newMessage.trim() ? '#cccccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: !newMessage.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Conversation;