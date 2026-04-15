import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { getPosts, Post } from "@/src/posts/posts";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, FlatList, Image, Pressable, Text, View } from "react-native";

const { height } = Dimensions.get("window");

const DEMO_POSTS: Post[] = [
  {
    id: "1",
    text: "Welcome to BlackBunny",
    userId: "demo",
    username: "BlackBunny",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "2",
    text: "Your feed is live",
    userId: "demo",
    username: "BlackBunny",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "3",
    text: "Scroll through the feed in full screen",
    userId: "demo",
    username: "BlackBunny",
    createdAt: Date.now() - 1800000,
  },
];

const formatTimestamp = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize on first mount only
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts.length > 0 ? fetchedPosts : DEMO_POSTS);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts(DEMO_POSTS);
      } finally {
        setLoading(false);
      }
    };

    if (!hasInitialized) {
      fetchPosts();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Refresh feed when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshFeed = async () => {
        try {
          const fetchedPosts = await getPosts();
          if (fetchedPosts.length > 0) {
            setPosts(fetchedPosts);
          }
        } catch (error) {
          console.error("Error refreshing feed:", error);
        }
      };

      // Only refresh if we've already initialized
      if (hasInitialized && !loading) {
        refreshFeed();
      }
    }, [hasInitialized, loading])
  );

  const renderItem = ({ item }: { item: Post }) => (
    <View
      style={{
        height,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 380,
          paddingVertical: 20,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: COLORS.textSecondary,
          borderBottomColor: COLORS.textSecondary,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          {item.userAvatar ? (
            <Image
              source={{ uri: item.userAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: COLORS.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.background }}>
                {item.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700" }}>{item.username}</Text>
            <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary }}>
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={{ ...TEXT_STYLES.bodyText, marginBottom: 16 }}>{item.text}</Text>

        {item.mediaUrl ? (
          item.mediaType === "image" ? (
            <Image
              source={{ uri: item.mediaUrl }}
              style={{ width: "100%", height: 240, borderRadius: 16 }}
            />
          ) : item.mediaType === "video" ? (
            <Pressable
              onPress={() => {
                // For now, just show an alert. In a full implementation, this would open a video player
                alert("Video playback would open here. URL: " + item.mediaUrl);
              }}
              style={{ position: "relative" }}
            >
              <View style={{
                width: "100%",
                height: 240,
                borderRadius: 16,
                backgroundColor: COLORS.dark,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: COLORS.accent + '80',
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 24, color: COLORS.background }}>▶️</Text>
                </View>
                <Text style={{
                  ...TEXT_STYLES.bodyText,
                  color: COLORS.textSecondary,
                  marginTop: 12,
                  textAlign: "center"
                }}>
                  Tap to play video
                </Text>
              </View>
            </Pressable>
          ) : null
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ height, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 18 }}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      updateCellsBatchingPeriod={50}
      getItemLayout={(data, index) => ({
        length: height,
        offset: height * index,
        index,
      })}
    />
  );
}
