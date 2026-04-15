import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for local storage
const STORAGE_KEYS = {
  CACHED_POSTS: 'cached_posts',
  CACHED_MESSAGES: 'cached_messages',
  OFFLINE_QUEUE: 'offline_queue',
  USER_PROFILE: 'user_profile',
  NETWORK_STATUS: 'network_status',
};

export interface OfflineMessage {
  id: string;
  recipientId: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'failed';
}

export interface CachedPost {
  id: string;
  text: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: number;
  cachedAt: number;
}

// Cache posts for offline viewing
export const cachePosts = async (posts: CachedPost[]): Promise<void> => {
  try {
    const data = {
      posts,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_POSTS, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching posts:', error);
  }
};

// Get cached posts
export const getCachedPosts = async (): Promise<CachedPost[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_POSTS);
    if (data) {
      const parsed = JSON.parse(data);
      // Return posts that are less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.posts || [];
      }
    }
  } catch (error) {
    console.error('Error getting cached posts:', error);
  }
  return [];
};

// Add message to offline queue
export const queueOfflineMessage = async (message: OfflineMessage): Promise<void> => {
  try {
    const existing = await getOfflineQueue();
    existing.push(message);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(existing));
  } catch (error) {
    console.error('Error queuing offline message:', error);
  }
};

// Get offline message queue
export const getOfflineQueue = async (): Promise<OfflineMessage[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

// Clear sent messages from queue
export const clearSentMessages = async (sentMessageIds: string[]): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    const remaining = queue.filter(msg => !sentMessageIds.includes(msg.id));
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
  } catch (error) {
    console.error('Error clearing sent messages:', error);
  }
};

// Cache user profile
export const cacheUserProfile = async (profile: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
      ...profile,
      cachedAt: Date.now(),
    }));
  } catch (error) {
    console.error('Error caching user profile:', error);
  }
};

// Get cached user profile
export const getCachedUserProfile = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached profile:', error);
    return null;
  }
};

// Store network status
export const setNetworkStatus = async (isOnline: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_STATUS, JSON.stringify({
      isOnline,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error setting network status:', error);
  }
};

// Get network status
export const getNetworkStatus = async (): Promise<{ isOnline: boolean; timestamp: number } | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NETWORK_STATUS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting network status:', error);
    return null;
  }
};

// Clear all cached data
export const clearCache = async (): Promise<void> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};;