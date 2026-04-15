import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { auth } from "@/src/firebase/config";
import { getUserProfile, updateUserProfile } from "@/src/services/users";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function EditProfile() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (auth.currentUser) {
          const profile = await getUserProfile(auth.currentUser.uid);
          if (profile) {
            setUsername(profile.username);
            setBio(profile.bio);
            setAvatar(profile.avatar);
            setBanner(profile.banner);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (username.length > 30) {
      Alert.alert("Error", "Username cannot exceed 30 characters");
      return;
    }

    if (bio.length > 200) {
      Alert.alert("Error", "Bio cannot exceed 200 characters");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(auth.currentUser.uid, {
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        banner: banner.trim(),
      });
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...TEXT_STYLES.bodyText }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 24 }}>
        <Text style={{ ...TEXT_STYLES.title, marginBottom: 30, textAlign: "center" }}>
          Edit Profile
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 12 }}>
            Avatar URL
          </Text>
          <TextInput
            placeholder="https://..."
            placeholderTextColor="#666"
            value={avatar}
            onChangeText={setAvatar}
            style={{
              backgroundColor: COLORS.dark,
              padding: 16,
              color: COLORS.text,
              fontFamily: TEXT_STYLES.body.fontFamily,
              fontSize: TEXT_STYLES.bodyText.fontSize,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 16 }}
            />
          ) : null}

          <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 12 }}>
            Banner URL
          </Text>
          <TextInput
            placeholder="https://..."
            placeholderTextColor="#666"
            value={banner}
            onChangeText={setBanner}
            style={{
              backgroundColor: COLORS.dark,
              padding: 16,
              color: COLORS.text,
              fontFamily: TEXT_STYLES.body.fontFamily,
              fontSize: TEXT_STYLES.bodyText.fontSize,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          {banner ? (
            <Image
              source={{ uri: banner }}
              style={{ width: "100%", height: 140, borderRadius: 12, marginBottom: 16 }}
            />
          ) : null}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 12 }}>
            Username
          </Text>
          <TextInput
            placeholder="Enter username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            maxLength={30}
            style={{
              backgroundColor: COLORS.dark,
              padding: 16,
              color: COLORS.text,
              fontFamily: TEXT_STYLES.body.fontFamily,
              fontSize: TEXT_STYLES.bodyText.fontSize,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
          <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary }}>
            {username.length}/30 characters
          </Text>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 12 }}>
            Bio
          </Text>
          <TextInput
            placeholder="Tell us about yourself"
            placeholderTextColor="#666"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={200}
            style={{
              backgroundColor: COLORS.dark,
              padding: 16,
              color: COLORS.text,
              fontFamily: TEXT_STYLES.body.fontFamily,
              fontSize: TEXT_STYLES.bodyText.fontSize,
              borderRadius: 8,
              height: 100,
              textAlignVertical: "top",
              marginBottom: 8,
            }}
          />
          <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary }}>
            {bio.length}/200 characters
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? COLORS.textSecondary : COLORS.accent,
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ ...TEXT_STYLES.button }}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: COLORS.textSecondary,
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ ...TEXT_STYLES.button }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
