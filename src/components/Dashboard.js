import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contentService } from '../apiService';
import { messageService } from '../messageService';
import { UserContext } from '../App';

const Dashboard = () => {
  const [recentContents, setRecentContents] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentError, setContentError] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentContents = async () => {
      try {
        const allContents = await contentService.getAllContents();
        // Sort by creation date (newest first) and take only the 3 most recent
        const sorted = allContents.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 3);
        
        setRecentContents(sorted);
      } catch (err) {
        console.error('Error fetching recent contents:', err);
        setContentError('Failed to load recent content');
      }
    };

    fetchRecentContents();
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser._id) return;

    const fetchRecentMessages = async () => {
      try {
        // Subscribe to user conversations for real-time updates
        const unsubscribe = messageService.subscribeToUserConversations(
          currentUser._id,
          async (conversations) => {
            // Sort by last message timestamp (newest first) and take only the 3 most recent
            const sorted = conversations
              .filter(convo => convo.lastMessage)
              .sort((a, b) => {
                const timeA = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp.toDate()) : new Date(0);
                const timeB = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp.toDate()) : new Date(0);
                return timeB - timeA;
              })
              .slice(0, 3);
            
            // Fetch user details for each conversation's participants
            const conversationsWithUsers = await Promise.all(
              sorted.map(async (convo) => {
                try {
                  const otherUserId = convo.participants.find(id => id !== currentUser._id);
                  const response = await fetch(`http://localhost:3000/api/user/profile/${otherUserId}`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  
                  if (response.ok) {
                    const userData = await response.json();
                    return { ...convo, otherUser: userData };
                  }
                  return convo;
                } catch (err) {
                  console.error('Error fetching user details:', err);
                  return convo;
                }
              })
            );
            
            setRecentMessages(conversationsWithUsers);
            setIsLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching recent messages:', err);
        setMessageError('Failed to load recent messages');
        setIsLoading(false);
      }
    };

    fetchRecentMessages();
  }, [currentUser]);

  // Helper function to format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Helper to get content title
  const getContentTitle = (content) => {
    return content.extraFields.postTitle || 
           content.extraFields.jobTitle || 
           content.extraFields.eventTitle || 
           content.extraFields.projectTitle || 
           content.extraFields.tutorialTitle || 
           `${content.contentType} (No Title)`;
  };

  return (
    <main style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>
            Welcome to the Dashboard
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#555' }}>
            {currentUser ? `Hello, ${currentUser.username}!` : 'You are logged in!'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/profile" style={{ 
            padding: '10px 15px', 
            backgroundColor: '#f0f0f0', 
            color: '#333', 
            borderRadius: '4px', 
            textDecoration: 'none' 
          }}>
            👤 View Profile
          </Link>
          <Link to="/create" style={{ 
            padding: '10px 15px', 
            backgroundColor: '#2ecc71', 
            color: 'white', 
            borderRadius: '4px', 
            textDecoration: 'none' 
          }}>
            ➕ Create New Content
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Recent Content Section */}
        <div style={{ 
          flex: '1 1 300px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', 
          padding: '20px',
          minHeight: '300px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '15px', 
            paddingBottom: '10px', 
            borderBottom: '1px solid #eee'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recent Content</h3>
            <Link to="/contents" style={{ 
              fontSize: '0.9rem', 
              color: '#4e54c8', 
              textDecoration: 'none' 
            }}>
              View All →
            </Link>
          </div>
          
          {contentError ? (
            <p style={{ color: '#e74c3c' }}>{contentError}</p>
          ) : recentContents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {recentContents.map(content => (
                <div key={content._id} style={{ 
                  padding: '15px', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '6px',
                  borderLeft: '4px solid #4e54c8'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{getContentTitle(content)}</h4>
                    <span style={{ 
                      backgroundColor: '#e8f0fe', 
                      color: '#1a73e8', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem' 
                    }}>
                      {content.contentType}
                    </span>
                  </div>
                  <p style={{ 
                    margin: '5px 0', 
                    fontSize: '0.9rem', 
                    color: '#666' 
                  }}>
                    Created: {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '30px', color: '#999' }}>
              <p>No content yet</p>
              <Link to="/create" style={{ 
                display: 'inline-block', 
                marginTop: '10px', 
                padding: '8px 15px', 
                backgroundColor: '#4e54c8', 
                color: 'white', 
                borderRadius: '4px', 
                textDecoration: 'none' 
              }}>
                Create Your First Content
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Messages Section */}
        <div style={{ 
          flex: '1 1 300px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', 
          padding: '20px',
          minHeight: '300px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '15px', 
            paddingBottom: '10px', 
            borderBottom: '1px solid #eee'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recent Messages</h3>
            <Link to="/messages" style={{ 
              fontSize: '0.9rem', 
              color: '#4e54c8', 
              textDecoration: 'none' 
            }}>
              View All →
            </Link>
          </div>
          
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#999', paddingTop: '20px' }}>Loading messages...</p>
          ) : messageError ? (
            <p style={{ color: '#e74c3c' }}>{messageError}</p>
          ) : recentMessages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {recentMessages.map(convo => (
                <Link 
                  key={convo.id} 
                  to={`/messages/${convo.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '6px',
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e0e0ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '16px', 
                      fontWeight: 'bold' 
                    }}>
                      {convo.otherUser ? convo.otherUser.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'baseline' 
                      }}>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>
                          {convo.otherUser ? convo.otherUser.username : 'User'}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>
                          {formatTimestamp(convo.lastMessage?.timestamp)}
                        </span>
                      </div>
                      <p style={{ 
                        margin: '5px 0 0 0', 
                        fontSize: '0.9rem', 
                        color: '#666',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '230px'
                      }}>
                        {convo.lastMessage?.senderId === currentUser?._id && "You: "}
                        {convo.lastMessage?.text}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '30px', color: '#999' }}>
              <p>No messages yet</p>
              <Link to="/messages" style={{ 
                display: 'inline-block', 
                marginTop: '10px', 
                padding: '8px 15px', 
                backgroundColor: '#4e54c8', 
                color: 'white', 
                borderRadius: '4px', 
                textDecoration: 'none' 
              }}>
                Start Messaging
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Dashboard;