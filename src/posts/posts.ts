import NetInfo from "@react-native-community/netinfo";
import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { CachedPost, cachePosts, getCachedPosts } from "../services/localStorage";
import { getUserProfile, isUserBanned } from "../services/users";

export interface Post {
  id: string;
  text: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt: number;
}

export const createPost = async (
  text: string,
  userId: string,
  mediaUrl?: string,
  mediaType?: "image" | "video"
) => {
  // Check if user is banned
  const banned = await isUserBanned(userId);
  if (banned) {
    throw new Error("Account is banned");
  }

  const trimmedText = text.trim();
  const trimmedMediaUrl = mediaUrl?.trim() || "";

  if (!trimmedText && !trimmedMediaUrl) {
    throw new Error("Post cannot be empty");
  }

  if (trimmedText.length > 500) {
    throw new Error("Post cannot exceed 500 characters");
  }

  // Additional safety: reject whitespace-only posts
  if (!trimmedText && !trimmedMediaUrl) {
    throw new Error("Post content required");
  }

  // Get user profile for username and avatar
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error("User profile not found");
  }

  const postData: any = {
    text: trimmedText,
    userId,
    username: userProfile.username || userProfile.email.split('@')[0],
    userAvatar: userProfile.avatar || "",
    createdAt: Date.now(),
  };

  if (trimmedMediaUrl) {
    postData.mediaUrl = trimmedMediaUrl;
    postData.mediaType = mediaType;
  }

  // Check network status
  const netInfo = await NetInfo.fetch();
  const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

  if (isOnline) {
    // Online: create post on server
    const docRef = await addDoc(collection(db, "posts"), postData);
    return { id: docRef.id, ...postData } as Post;
  } else {
    // Offline: create local post with temporary ID and queue for later
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlinePost = { id: tempId, ...postData, isOffline: true };

    // Cache the post locally
    const cachedPosts = await getCachedPosts();
    cachedPosts.unshift(offlinePost as CachedPost);
    await cachePosts(cachedPosts);

    // Note: In a full implementation, you'd queue this for sending when back online
    console.log("Post queued for offline sending:", offlinePost);

    return offlinePost as Post;
  }
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    if (isOnline) {
      // Online: fetch from server and cache
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const posts = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      // Cache posts for offline use
      const cachedPosts: CachedPost[] = posts.map(post => ({
        ...post,
        cachedAt: Date.now(),
      }));
      await cachePosts(cachedPosts);

      return posts;
    } else {
      // Offline: return cached posts
      console.log("Offline mode: using cached posts");
      return await getCachedPosts();
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    // Fallback to cached posts on error
    return await getCachedPosts();
  }
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const q = query(
    collection(db, "posts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];
};
