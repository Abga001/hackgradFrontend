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
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

export const messageService = {
  // Create a new conversation between two users
  createConversation: async (currentUserId, otherUserId) => {
    try {
      console.log(`Attempting to create conversation between ${currentUserId} and ${otherUserId}`);
      
      // Check if users exist
      if (!currentUserId || !otherUserId) {
        throw new Error("Invalid user IDs provided");
      }
      
      // Check if a conversation already exists
      try {
        console.log("Checking for existing conversation");
        const existingConvo = await messageService.getConversationByParticipants(currentUserId, otherUserId);
        if (existingConvo) {
          console.log("Existing conversation found:", existingConvo.id);
          return existingConvo;
        }
      } catch (checkError) {
        console.error("Error checking for existing conversation:", checkError);
        // Continue to create a new one rather than failing
      }

      // Create a new conversation
      console.log("Creating new conversation");
      try {
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
        
        console.log("Conversation created successfully:", convoRef.id);
        
        // Create userConversation entries for both users
        try {
          console.log("Creating user conversation entry for current user");
          await addDoc(collection(db, "userConversations"), {
            userId: currentUserId,
            conversationId: convoRef.id,
            unreadCount: 0,
            lastReadTimestamp: serverTimestamp()
          });
          
          console.log("Creating user conversation entry for other user");
          await addDoc(collection(db, "userConversations"), {
            userId: otherUserId,
            conversationId: convoRef.id,
            unreadCount: 0,
            lastReadTimestamp: serverTimestamp()
          });
          
          console.log("User conversation entries created successfully");
        } catch (userConvoError) {
          console.error("Error creating user conversation entries:", userConvoError);
          throw new Error(`Failed to create user conversation entries: ${userConvoError.message}`);
        }

        return { id: convoRef.id };
      } catch (convoError) {
        console.error("Error creating conversation document:", convoError);
        throw new Error(`Failed to create conversation: ${convoError.message}`);
      }
    } catch (error) {
      console.error("Conversation creation failed:", error);
      throw error;
    }
  },

  // Get a conversation by its ID
  getConversationById: async (conversationId) => {
    try {
      console.log("Getting conversation by ID:", conversationId);
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      
      const convoRef = doc(db, "conversations", conversationId);
      const convoSnap = await getDoc(convoRef);
      
      if (convoSnap.exists()) {
        console.log("Conversation found");
        return { id: convoSnap.id, ...convoSnap.data() };
      } else {
        console.log("No conversation found with ID:", conversationId);
        return null;
      }
    } catch (error) {
      console.error("Error getting conversation by ID:", error);
      throw error;
    }
  },

  // Get a conversation by participants
  getConversationByParticipants: async (userId1, userId2) => {
    try {
      console.log("Searching for conversation between users:", userId1, userId2);
      if (!userId1 || !userId2) {
        throw new Error("Both user IDs are required");
      }
      
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId1)
      );
      
      const querySnapshot = await getDocs(q);
      let conversation = null;
      
      console.log(`Found ${querySnapshot.size} conversations for user ${userId1}`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          console.log("Found matching conversation:", doc.id);
          conversation = { id: doc.id, ...data };
        }
      });
      
      return conversation;
    } catch (error) {
      console.error("Error getting conversation by participants:", error);
      throw error;
    }
  },

  // Get all conversations for a user
  getUserConversations: async (userId) => {
    try {
      console.log("Getting all conversations for user:", userId);
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = [];
      
      console.log(`Found ${querySnapshot.size} conversations for user ${userId}`);
      
      querySnapshot.forEach((doc) => {
        conversations.push({ id: doc.id, ...doc.data() });
      });
      
      return conversations;
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw error;
    }
  },

  // Subscribe to user conversations (real-time updates)
  subscribeToUserConversations: (userId, callback) => {
    try {
      console.log("Setting up real-time listener for user conversations:", userId);
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`Real-time update: ${querySnapshot.size} conversations for user ${userId}`);
        const conversations = [];
        querySnapshot.forEach((doc) => {
          conversations.push({ id: doc.id, ...doc.data() });
        });
        callback(conversations);
      }, (error) => {
        console.error("Error in conversation subscription:", error);
        // Don't throw here since this is a callback-based API
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up conversation subscription:", error);
      throw error;
    }
  },

  // Send a message to a conversation
  sendMessage: async (conversationId, senderId, text, media = null) => {
    try {
      console.log(`Sending message in conversation ${conversationId} from user ${senderId}`);
      if (!conversationId || !senderId || !text) {
        throw new Error("Conversation ID, sender ID, and message text are required");
      }

      // Add the message to the messages collection
      console.log("Creating message document");
      const messageData = {
        conversationId,
        senderId,
        text,
        timestamp: serverTimestamp(),
        read: false
      };
      
      if (media) {
        messageData.media = media;
      }
      
      const messageRef = await addDoc(collection(db, "messages"), messageData);
      console.log("Message created with ID:", messageRef.id);

      // Update the conversation's lastMessage and updatedAt
      console.log("Updating conversation with last message");
      const convoRef = doc(db, "conversations", conversationId);
      await updateDoc(convoRef, {
        lastMessage: {
          text,
          senderId,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // Update unreadCount for all participants except sender
      const convoSnap = await getDoc(convoRef);
      if (convoSnap.exists()) {
        const convoData = convoSnap.data();
        const otherParticipants = convoData.participants.filter(id => id !== senderId);

        console.log("Updating unread counts for participants:", otherParticipants);
        
        // Get userConversation documents for other participants
        for (const participantId of otherParticipants) {
          const userConvoQuery = query(
            collection(db, "userConversations"),
            where("userId", "==", participantId),
            where("conversationId", "==", conversationId)
          );
          
          const userConvoSnap = await getDocs(userConvoQuery);
          userConvoSnap.forEach(async (userConvoDoc) => {
            const currentUnreadCount = userConvoDoc.data().unreadCount || 0;
            await updateDoc(doc(db, "userConversations", userConvoDoc.id), {
              unreadCount: currentUnreadCount + 1
            });
            console.log(`Updated unread count for user ${participantId}`);
          });
        }
      }

      return { id: messageRef.id };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    try {
      console.log("Getting messages for conversation:", conversationId);
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      console.log(`Found ${querySnapshot.size} messages in conversation ${conversationId}`);
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      return messages;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  // Subscribe to messages for a conversation (real-time updates)
  subscribeToMessages: (conversationId, callback) => {
    try {
      console.log("Setting up real-time listener for messages in conversation:", conversationId);
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`Real-time update: ${querySnapshot.size} messages in conversation ${conversationId}`);
        const messages = [];
        querySnapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
      }, (error) => {
        console.error("Error in messages subscription:", error);
        // Don't throw here since this is a callback-based API
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up messages subscription:", error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId, userId) => {
    try {
      console.log(`Marking messages as read in conversation ${conversationId} for user ${userId}`);
      if (!conversationId || !userId) {
        throw new Error("Conversation ID and user ID are required");
      }
      
      // Get unread messages sent by others
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("senderId", "!=", userId),
        where("read", "==", false)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} unread messages to mark as read`);
      
      // Update each message
      const updatePromises = [];
      querySnapshot.forEach((docSnapshot) => {
        updatePromises.push(
          updateDoc(doc(db, "messages", docSnapshot.id), { read: true })
        );
      });
      
      await Promise.all(updatePromises);
      console.log("All messages marked as read");
      
      // Reset unreadCount for this user's conversation
      const userConvoQuery = query(
        collection(db, "userConversations"),
        where("userId", "==", userId),
        where("conversationId", "==", conversationId)
      );
      
      const userConvoSnap = await getDocs(userConvoQuery);
      userConvoSnap.forEach(async (userConvoDoc) => {
        await updateDoc(doc(db, "userConversations", userConvoDoc.id), {
          unreadCount: 0,
          lastReadTimestamp: serverTimestamp()
        });
        console.log("Reset unread counter for user conversation");
      });
      
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  // Get total unread message count for a user
  getTotalUnreadCount: async (userId) => {
    try {
      console.log("Getting total unread count for user:", userId);
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const q = query(
        collection(db, "userConversations"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalUnread = 0;
      
      querySnapshot.forEach((doc) => {
        totalUnread += doc.data().unreadCount || 0;
      });
      
      console.log(`Total unread messages for user ${userId}: ${totalUnread}`);
      return totalUnread;
    } catch (error) {
      console.error("Error getting total unread count:", error);
      throw error;
    }
  }
};