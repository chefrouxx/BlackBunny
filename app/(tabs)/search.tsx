import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { getPosts, Post } from "@/src/posts/posts";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, FlatList, Image, Pressable, Text, TextInput, View } from "react-native";

const { height } = Dimensions.get("window");

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

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize on first mount only
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setAllPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
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
      const refreshPosts = async () => {
        try {
          const fetchedPosts = await getPosts();
          setAllPosts(fetchedPosts);
        } catch (error) {
          console.error("Error refreshing posts:", error);
        }
      };

      // Only refresh if we've already initialized
      if (hasInitialized && !loading) {
        refreshPosts();
      }
    }, [hasInitialized, loading])
  );

  const handleSearch = (text: string) => {
    setSearchTerm(text);

    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const searchLower = text.toLowerCase();
    const filteredPosts = allPosts.filter(post =>
      post.text.toLowerCase().includes(searchLower) ||
      post.username.toLowerCase().includes(searchLower) ||
      (post.mediaType && post.mediaType.toLowerCase().includes(searchLower))
    );

    setSearchResults(filteredPosts.slice(0, 50)); // Limit results
  };

  const renderItem = ({ item }: { item: Post }) => (
    <View
      style={{
        height: height * 0.6, // Smaller than main feed
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 350,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          {item.userAvatar ? (
            <Image
              source={{ uri: item.userAvatar }}
              style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
            />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: COLORS.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.background, fontSize: 14 }}>
                {item.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700", fontSize: 14 }}>{item.username}</Text>
            <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 10, color: COLORS.textSecondary }}>
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={{ ...TEXT_STYLES.bodyText, marginBottom: 12, fontSize: 14 }} numberOfLines={3}>
          {item.text}
        </Text>

        {item.mediaUrl ? (
          item.mediaType === "image" ? (
            <Image
              source={{ uri: item.mediaUrl }}
              style={{ width: "100%", height: 180, borderRadius: 12 }}
            />
          ) : item.mediaType === "video" ? (
            <Pressable
              onPress={() => {
                alert("Video playback would open here. URL: " + item.mediaUrl);
              }}
              style={{ position: "relative" }}
            >
              <View style={{
                width: "100%",
                height: 180,
                borderRadius: 12,
                backgroundColor: COLORS.dark,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: COLORS.accent + '80',
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 16, color: COLORS.background }}>▶️</Text>
                </View>
              </View>
            </Pressable>
          ) : null
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 18 }}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Search Input */}
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.textSecondary }}>
        <TextInput
          placeholder="Search posts, users, or content..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={handleSearch}
          style={{
            padding: 16,
            color: COLORS.text,
            borderRadius: 12,
            fontFamily: TEXT_STYLES.body.fontFamily,
            fontSize: TEXT_STYLES.bodyText.fontSize,
            borderWidth: 1,
            borderColor: COLORS.textSecondary,
            backgroundColor: COLORS.dark,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Search Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListEmptyComponent={
          searchTerm.length > 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center" }}>
                No posts found matching &quot;{searchTerm}&quot;
              </Text>
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center" }}>
                Search for posts, users, or hashtags
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}