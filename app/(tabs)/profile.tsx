import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { auth } from "@/src/firebase/config";
import { getUserPosts, Post } from "@/src/posts/posts";
import { getUserProfile } from "@/src/services/users";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";

export default function Profile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const router = useRouter();

  // Initialize profile data on first mount only
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!auth.currentUser) {
          return;
        }

        const profile = await getUserProfile(auth.currentUser.uid);
        const userPosts = await getUserPosts(auth.currentUser.uid);

        setUserProfile(profile);
        setPosts(userPosts);
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    if (!hasInitialized) {
      fetchData();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshProfileData = async () => {
        try {
          if (!auth.currentUser) {
            return;
          }
          const profile = await getUserProfile(auth.currentUser.uid);
          const userPosts = await getUserPosts(auth.currentUser.uid);

          setUserProfile(profile);
          setPosts(userPosts);
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      };

      if (hasInitialized && !loading) {
        refreshProfileData();
      }
    }, [hasInitialized, loading])
  );

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
              router.replace('/auth');
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to logout");
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(tabs)/edit-profile');
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: COLORS.textSecondary,
        paddingVertical: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        {item.userAvatar ? (
          <Image
            source={{ uri: item.userAvatar }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={{ ...TEXT_STYLES.bodyText, marginBottom: 12 }}>{item.text}</Text>

      {item.mediaUrl ? (
        item.mediaType === "image" ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={{ width: "100%", height: 200, borderRadius: 14, marginTop: 8 }}
          />
        ) : (
          <View style={{ paddingVertical: 12, marginTop: 8 }}>
            <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary }}>
              Video attached: {item.mediaUrl}
            </Text>
          </View>
        )
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...TEXT_STYLES.bodyText }}>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...TEXT_STYLES.bodyText }}>Profile not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {userProfile.banner ? (
        <Image
          source={{ uri: userProfile.banner }}
          style={{ width: "100%", height: 180 }}
        />
      ) : (
        <View style={{ width: "100%", height: 180, backgroundColor: COLORS.dark }} />
      )}

      <View style={{ padding: 24 }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          {userProfile.avatar ? (
            <Image
              source={{ uri: userProfile.avatar }}
              style={{ width: 110, height: 110, borderRadius: 55, marginTop: -60, borderWidth: 4, borderColor: COLORS.background }}
            />
          ) : (
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: COLORS.dark,
                justifyContent: "center",
                alignItems: "center",
                marginTop: -60,
                borderWidth: 4,
                borderColor: COLORS.background,
              }}
            >
              <Text style={{ ...TEXT_STYLES.title, fontSize: 36 }}>{userProfile.username?.charAt(0).toUpperCase() || "U"}</Text>
            </View>
          )}

          <Text style={{ ...TEXT_STYLES.title, marginTop: 16 }}>{userProfile.username || "No username"}</Text>
          <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, marginTop: 8 }}>{userProfile.bio || "No bio yet."}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <Pressable
            onPress={handleEditProfile}
            style={{ flex: 1, backgroundColor: COLORS.accent, padding: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ ...TEXT_STYLES.button }}>Edit Profile</Text>
          </Pressable>
          <Pressable
            onPress={handleLogout}
            style={{ flex: 1, backgroundColor: COLORS.textSecondary, padding: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ ...TEXT_STYLES.button }}>Logout</Text>
          </Pressable>
        </View>

        <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 16 }}>Your posts</Text>

        {posts.length === 0 ? (
          <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center", marginTop: 24 }}>
            You haven&apos;t posted yet. Share your first photo, video, or thought.
          </Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </View>
    </ScrollView>
  );
}
