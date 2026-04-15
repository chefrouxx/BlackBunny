import {
    addDoc,
    collection,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QuerySnapshot,
    setDoc,
    where
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface ChatRoom {
  id: string;
  name: string;
  members: string[];
  type: "group" | "direct";
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  username: string;
  createdAt: number;
  messageType?: "text" | "image" | "video";
  mediaUrl?: string;
  status?: "sending" | "sent" | "delivered" | "read";
}

export interface DirectMessage {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  lastMessageAt: number;
  unreadCount: { [userId: string]: number };
}

export const getChats = async (): Promise<ChatRoom[]> => {
  const chatQuery = query(collection(db, "chats"), orderBy("name", "asc"));
  const snap = await getDocs(chatQuery);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ChatRoom, "id">),
  }));
};

export const subscribeToChatMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(messagesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ChatMessage, "id">),
    })) as ChatMessage[];
    callback(messages);
  });
};

export const sendChatMessage = async (
  chatId: string,
  text: string,
  userId: string,
  username: string,
) => {
  if (!text.trim()) {
    throw new Error("Message cannot be empty");
  }

  if (text.length > 500) {
    throw new Error("Message cannot exceed 500 characters");
  }

  // Import once at top if not already present
  const { isUserBanned } = await import("./users");
  const banned = await isUserBanned(userId);
  if (banned) {
    throw new Error("Account is banned");
  }

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: text.trim(),
    userId,
    username,
    createdAt: Date.now(),
    messageType: "text",
    status: "sent"
  });
};

// DIRECT MESSAGING FUNCTIONS

export const getOrCreateDirectMessage = async (userId1: string, userId2: string): Promise<string> => {
  // Create a consistent chat ID by sorting user IDs
  const participants = [userId1, userId2].sort();
  const chatId = `dm_${participants[0]}_${participants[1]}`;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    // Create the direct message chat
    await setDoc(chatRef, {
      id: chatId,
      name: "", // Direct messages don't need names
      members: participants,
      type: "direct",
      createdAt: Date.now()
    });
  }

  return chatId;
};

export const getUserDirectMessages = async (userId: string): Promise<DirectMessage[]> => {
  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("members", "array-contains", userId),
    where("type", "==", "direct")
  );

  const snap = await getDocs(q);
  const directMessages: DirectMessage[] = [];

  for (const chatDoc of snap.docs) {
    const chatData = chatDoc.data() as ChatRoom;

    // Get the last message
    const messagesRef = collection(db, "chats", chatDoc.id, "messages");
    const lastMessageQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
    const lastMessageSnap = await getDocs(lastMessageQuery);

    let lastMessage: ChatMessage | undefined;
    if (!lastMessageSnap.empty) {
      const msgDoc = lastMessageSnap.docs[0];
      lastMessage = {
        id: msgDoc.id,
        ...(msgDoc.data() as Omit<ChatMessage, "id">)
      };
    }

    // Get unread count for this user
    const unreadCount = await getUnreadCount(chatDoc.id, userId);

    directMessages.push({
      id: chatDoc.id,
      participants: chatData.members,
      lastMessage,
      lastMessageAt: lastMessage?.createdAt || chatData.createdAt,
      unreadCount: { [userId]: unreadCount }
    });
  }

  // Sort by last message time
  return directMessages.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
};

export const getUnreadCount = async (chatId: string, userId: string): Promise<number> => {
  // This would need to be implemented with read receipts
  // For now, return 0 as a placeholder
  return 0;
};

export const sendDirectMessage = async (
  recipientId: string,
  text: string,
  userId: string,
  username: string,
  messageType: "text" | "image" | "video" = "text",
  mediaUrl?: string
) => {
  if (!text.trim() && !mediaUrl) {
    throw new Error("Message cannot be empty");
  }

  if (text.length > 500) {
    throw new Error("Message cannot exceed 500 characters");
  }

  // Get or create the direct message chat
  const chatId = await getOrCreateDirectMessage(userId, recipientId);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: text.trim(),
    userId,
    username,
    createdAt: Date.now(),
    messageType,
    mediaUrl,
    status: "sent"
  });

  return chatId;
};
