import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  bio: string;
  avatar: string;
  banner: string;
  friends: string[];
  createdAt: number;
  banned: boolean;
}

export const createUserProfile = async (userId: string, email: string) => {
  const userRef = doc(db, "users", userId);
  const userProfile: UserProfile = {
    uid: userId,
    email,
    username: "",
    bio: "",
    avatar: "",
    banner: "",
    friends: [],
    createdAt: Date.now(),
    banned: false,
  };

  await setDoc(userRef, userProfile);
  return userProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as Partial<UserProfile>;
    return {
      uid: data.uid || userId,
      email: data.email || "",
      username: data.username || "",
      bio: data.bio || "",
      avatar: data.avatar || "",
      banner: data.banner || "",
      friends: data.friends || [],
      createdAt: data.createdAt || Date.now(),
      banned: data.banned || false,
    };
  }
  return null;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, updates);
};

export const isUserBanned = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.banned || false;
};