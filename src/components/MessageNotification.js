import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { messageService } from '../messageService';

const MessageNotification = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchUnreadCount = async () => {
      try {
        const count = await messageService.getTotalUnreadCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Set up real-time listener for conversation updates
    const unsubscribe = messageService.subscribeToUserConversations(userId, async () => {
      // Refetch unread count when conversations update
      const count = await messageService.getTotalUnreadCount(userId);
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [userId]);

  if (unreadCount === 0) {
    return (
      <Link to="/messages" style={{ 
        color: 'white', 
        textDecoration: 'none',
        padding: '5px 10px',
        borderRadius: '4px'
      }}>
        Messages
      </Link>
    );
  }

  return (
    <Link to="/messages" style={{ 
      color: 'white', 
      textDecoration: 'none',
      padding: '5px 10px',
      borderRadius: '4px',
      position: 'relative'
    }}>
      Messages
      <span style={{
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#ff4b4b',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </Link>
  );
};

export default MessageNotification;