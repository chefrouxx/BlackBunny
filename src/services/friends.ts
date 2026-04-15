import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted"; // pending = requested, accepted = friends
  createdAt: number;
}

export interface UserSearch {
  uid: string;
  username: string;
  email: string;
  avatar?: string;
}

// Search users by username
export const searchUsers = async (searchTerm: string, currentUserId: string): Promise<UserSearch[]> => {
  if (!searchTerm.trim()) {
    return [];
  }

  const searchLower = searchTerm.toLowerCase();

  // Search in users collection
  const usersRef = collection(db, "users");
  const q = query(usersRef);
  const snap = await getDocs(q);

  const results = snap.docs
    .map((doc) => ({
      uid: doc.id,
      username: doc.data().username || "",
      email: doc.data().email || "",
      avatar: doc.data().avatar || "",
    }))
    .filter((user) => user.uid !== currentUserId && user.username.toLowerCase().includes(searchLower))
    .slice(0, 20); // Limit results

  return results as UserSearch[];
};

// Send friend request
export const sendFriendRequest = async (senderId: string, recipientId: string) => {
  if (senderId === recipientId) {
    throw new Error("Cannot add yourself");
  }

  // Check if already friends or request exists
  const existingRef = collection(db, "friendRequests");
  const q1 = query(
    existingRef,
    where("userId", "==", senderId),
    where("friendId", "==", recipientId),
  );
  const q2 = query(
    existingRef,
    where("userId", "==", recipientId),
    where("friendId", "==", senderId),
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  if (snap1.docs.length > 0 || snap2.docs.length > 0) {
    throw new Error("Friendship request already exists");
  }

  // Create friend request
  await addDoc(collection(db, "friendRequests"), {
    userId: senderId,
    friendId: recipientId,
    status: "pending",
    createdAt: Date.now(),
  });
};

// Accept friend request
export const acceptFriendRequest = async (requestId: string) => {
  const requestRef = doc(db, "friendRequests", requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error("Request not found");
  }

  const { userId, friendId } = requestSnap.data();

  // Update request status
  await updateDoc(requestRef, { status: "accepted" });

  // Add both users to each other's friends lists
  const userRef = doc(db, "users", userId);
  const friendRef = doc(db, "users", friendId);

  await Promise.all([
    updateDoc(userRef, { friends: arrayUnion(friendId) }),
    updateDoc(friendRef, { friends: arrayUnion(userId) }),
  ]);
};

// Decline friend request
export const declineFriendRequest = async (requestId: string) => {
  const requestRef = doc(db, "friendRequests", requestId);
  await deleteDoc(requestRef);
};

// Get friend requests for a user
export const getFriendRequests = async (userId: string): Promise<Friend[]> => {
  const q = query(collection(db, "friendRequests"), where("friendId", "==", userId), where("status", "==", "pending"));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Friend, "id">),
  })) as Friend[];
};

// Get friends list
export const getFriends = async (userId: string): Promise<UserSearch[]> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const friendIds = userSnap.data().friends || [];

  if (friendIds.length === 0) {
    return [];
  }

  const friends: UserSearch[] = [];

  for (const friendId of friendIds) {
    const friendRef = doc(db, "users", friendId);
    const friendSnap = await getDoc(friendRef);

    if (friendSnap.exists()) {
      const data = friendSnap.data();
      friends.push({
        uid: friendId,
        username: data.username || "",
        email: data.email || "",
        avatar: data.avatar || "",
      });
    }
  }

  return friends;
};

// Remove friend
export const removeFriend = async (userId: string, friendId: string) => {
  const userRef = doc(db, "users", userId);
  const friendRef = doc(db, "users", friendId);

  await Promise.all([
    updateDoc(userRef, { friends: arrayRemove(friendId) }),
    updateDoc(friendRef, { friends: arrayRemove(userId) }),
  ]);
};
