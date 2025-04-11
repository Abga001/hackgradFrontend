import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";

// Custom error class for more specific error handling
class MessagingError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'MessagingError';
    this.code = code;
    this.details = details;
  }
}

export const messageService = {
  // Validate user ID format (basic validation)
  validateUserId(userId) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new MessagingError('Invalid User ID', 'invalid-input', { userId });
    }
  },

  // Create a new conversation between two users
  async createConversation(currentUserId, otherUserId) {
    try {
      // Validate inputs
      this.validateUserId(currentUserId);
      this.validateUserId(otherUserId);

      // Prevent creating conversation with self
      if (currentUserId === otherUserId) {
        throw new MessagingError('Cannot create conversation with yourself', 'invalid-input');
      }

      // Check if conversation already exists
      const existingConvo = await this.getConversationByParticipants(currentUserId, otherUserId);
      if (existingConvo) {
        return existingConvo;
      }

      // Create conversation
      const convoRef = await addDoc(collection(db, "conversations"), {
        participants: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: "Start a conversation",
          senderId: "system",
          timestamp: serverTimestamp(),
        }
      });

      // Create user conversation entries
      const userConvoPromises = [currentUserId, otherUserId].map(userId => 
        addDoc(collection(db, "userConversations"), {
          userId,
          conversationId: convoRef.id,
          unreadCount: 0,
          lastReadTimestamp: serverTimestamp()
        })
      );

      // Perform atomic operation
      try {
        await Promise.all(userConvoPromises);
      } catch (subError) {
        // Rollback conversation if user conversations fail
        await deleteDoc(convoRef);
        throw new MessagingError(
          'Failed to create user conversations', 
          'operation-failed', 
          { originalError: subError.message }
        );
      }

      return { id: convoRef.id };
    } catch (error) {
      console.error('Conversation Creation Error:', {
        message: error.message,
        code: error.code || 'unknown',
        stack: error.stack
      });

      // Specific error handling
      if (error.code === 'permission-denied') {
        throw new MessagingError(
          'You do not have permission to create this conversation', 
          'permission-denied'
        );
      }

      throw error;
    }
  },

  // Get a conversation by its participants
  async getConversationByParticipants(userId1, userId2) {
    try {
      this.validateUserId(userId1);
      this.validateUserId(userId2);

      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId1)
      );
      
      const querySnapshot = await getDocs(q);
      let conversation = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          conversation = { id: doc.id, ...data };
        }
      });
      
      return conversation;
    } catch (error) {
      console.error('Get Conversation Error:', {
        message: error.message,
        participants: [userId1, userId2]
      });
      throw new MessagingError(
        'Failed to retrieve conversation', 
        'retrieval-failed', 
        { originalError: error.message }
      );
    }
  },

  // Get a conversation by its ID
  async getConversationById(conversationId) {
    try {
      if (!conversationId) {
        throw new MessagingError('Conversation ID is required', 'invalid-input');
      }

      const convoRef = doc(db, "conversations", conversationId);
      const convoSnap = await getDoc(convoRef);
      
      if (convoSnap.exists()) {
        return { id: convoSnap.id, ...convoSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get Conversation by ID Error:', {
        message: error.message,
        conversationId
      });
      throw new MessagingError(
        'Failed to retrieve conversation', 
        'retrieval-failed', 
        { originalError: error.message }
      );
    }
  },

  // Send a message
  async sendMessage(conversationId, senderId, text, media = null) {
    try {
      // Validate inputs
      if (!conversationId) {
        throw new MessagingError('Conversation ID is required', 'invalid-input');
      }
      this.validateUserId(senderId);

      // Sanitize and validate message
      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new MessagingError('Message cannot be empty', 'invalid-input');
      }

      // Check message length
      const MAX_MESSAGE_LENGTH = 1000;
      if (trimmedText.length > MAX_MESSAGE_LENGTH) {
        throw new MessagingError(
          `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`, 
          'validation-error'
        );
      }

      // Send message
      const messageRef = await addDoc(collection(db, "messages"), {
        conversationId,
        senderId,
        text: trimmedText,
        media,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation
      const convoRef = doc(db, "conversations", conversationId);
      await updateDoc(convoRef, {
        lastMessage: {
          text: trimmedText,
          senderId,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      return { id: messageRef.id };
    } catch (error) {
      console.error('Send Message Error:', {
        message: error.message,
        conversationId,
        senderId
      });

      // Specific error handling
      if (error.code === 'not-found') {
        throw new MessagingError(
          'Conversation not found. It may have been deleted.', 
          'not-found'
        );
      }

      throw error;
    }
  },

  // Subscribe to messages in a conversation
  subscribeToMessages(conversationId, callback) {
    try {
      if (!conversationId) {
        throw new MessagingError('Conversation ID is required', 'invalid-input');
      }

      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
      );
      
      return onSnapshot(q, 
        (querySnapshot) => {
          const messages = [];
          querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
          });
          callback(messages);
        },
        (error) => {
          console.error('Message Subscription Error:', error);
          throw new MessagingError(
            'Failed to subscribe to messages', 
            'subscription-failed', 
            { originalError: error.message }
          );
        }
      );
    } catch (error) {
      console.error('Subscribe to Messages Error:', {
        message: error.message,
        conversationId
      });
      throw error;
    }
  },

  // Subscribe to user conversations
  subscribeToUserConversations(userId, callback) {
    try {
      // Validate user ID
      this.validateUserId(userId);

      // Create a query for conversations involving the user
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );
      
      // Return the onSnapshot listener
      return onSnapshot(q, 
        (querySnapshot) => {
          const conversations = [];
          querySnapshot.forEach((doc) => {
            conversations.push({ id: doc.id, ...doc.data() });
          });
          callback(conversations);
        },
        (error) => {
          console.error('User Conversations Subscription Error:', error);
          throw new MessagingError(
            'Failed to subscribe to user conversations', 
            'subscription-failed', 
            { originalError: error.message }
          );
        }
      );
    } catch (error) {
      console.error('Subscribe to User Conversations Error:', {
        message: error.message,
        userId
      });
      throw error;
    }
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    try {
      if (!conversationId) {
        throw new MessagingError('Conversation ID is required', 'invalid-input');
      }
      this.validateUserId(userId);

      // Find unread messages
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("senderId", "!=", userId),
        where("read", "==", false)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Update each unread message
      const updatePromises = querySnapshot.docs.map(messageDoc => 
        updateDoc(doc(db, "messages", messageDoc.id), { read: true })
      );
      
      await Promise.all(updatePromises);
      
      // Reset unread count for this conversation
      const userConvoQuery = query(
        collection(db, "userConversations"),
        where("userId", "==", userId),
        where("conversationId", "==", conversationId)
      );
      
      const userConvoSnap = await getDocs(userConvoQuery);
      const updateUserConvoPromises = userConvoSnap.docs.map(userConvoDoc => 
        updateDoc(doc(db, "userConversations", userConvoDoc.id), {
          unreadCount: 0,
          lastReadTimestamp: serverTimestamp()
        })
      );

      await Promise.all(updateUserConvoPromises);
      
      return true;
    } catch (error) {
      console.error('Mark Messages Read Error:', {
        message: error.message,
        conversationId,
        userId
      });
      throw new MessagingError(
        'Failed to mark messages as read', 
        'update-failed', 
        { originalError: error.message }
      );
    }
  },

  // Get total unread message count
  async getTotalUnreadCount(userId) {
    try {
      this.validateUserId(userId);

      const q = query(
        collection(db, "userConversations"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalUnread = 0;
      
      querySnapshot.forEach((doc) => {
        totalUnread += doc.data().unreadCount || 0;
      });
      
      return totalUnread;
    } catch (error) {
      console.error('Get Unread Count Error:', {
        message: error.message,
        userId
      });
      throw new MessagingError(
        'Failed to retrieve unread message count', 
        'retrieval-failed', 
        { originalError: error.message }
      );
    }
  }
};

export default messageService;