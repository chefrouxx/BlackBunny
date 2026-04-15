import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { auth } from "@/src/firebase/config";
import { createPost } from "@/src/posts/posts";
import { createGroup } from "@/src/services/groups";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function Create() {
  const [tab, setTab] = useState<"post" | "group">("post");
  const [postText, setPostText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublishPost = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to post");
      return;
    }

    if (!postText.trim() && !mediaUrl.trim()) {
      Alert.alert("Error", "Post cannot be empty");
      return;
    }

    if (postText.length > 500) {
      Alert.alert("Error", "Post cannot exceed 500 characters");
      return;
    }

    setLoading(true);
    try {
      await createPost(postText, auth.currentUser.uid, mediaUrl.trim(), mediaUrl.trim() ? mediaType : undefined);
      setPostText("");
      setMediaUrl("");
      setMediaType("image");
      Alert.alert("Success", "Post created successfully!");
    } catch (error: any) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to create a group");
      return;
    }

    if (!groupName.trim()) {
      Alert.alert("Error", "Group name cannot be empty");
      return;
    }

    if (groupName.length > 50) {
      Alert.alert("Error", "Group name cannot exceed 50 characters");
      return;
    }

    if (groupDescription.length > 200) {
      Alert.alert("Error", "Group description cannot exceed 200 characters");
      return;
    }

    setLoading(true);
    try {
      await createGroup(groupName, groupDescription, auth.currentUser.uid);
      setGroupName("");
      setGroupDescription("");
      Alert.alert("Success", "Group created successfully!");
    } catch (error: any) {
      console.error("Error creating group:", error);
      Alert.alert("Error", error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 24 }}>
        {/* Tab Selector */}
        <View style={{ flexDirection: "row", marginBottom: 24, gap: 12 }}>
          <Pressable
            onPress={() => setTab("post")}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 8,
              backgroundColor: tab === "post" ? COLORS.accent : "transparent",
              borderBottomWidth: tab === "post" ? 0 : 2,
              borderBottomColor: COLORS.textSecondary,
              alignItems: "center",
            }}
          >
            <Text style={{ ...TEXT_STYLES.bodyText, color: tab === "post" ? COLORS.background : COLORS.text, fontWeight: "700" }}>
              📝 Post
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab("group")}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 8,
              backgroundColor: tab === "group" ? COLORS.accent : "transparent",
              borderBottomWidth: tab === "group" ? 0 : 2,
              borderBottomColor: COLORS.textSecondary,
              alignItems: "center",
            }}
          >
            <Text style={{ ...TEXT_STYLES.bodyText, color: tab === "group" ? COLORS.background : COLORS.text, fontWeight: "700" }}>
              👥 Group
            </Text>
          </Pressable>
        </View>

        {/* Post Creation */}
        {tab === "post" && (
          <>
            <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 20 }}>Create Post</Text>

            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor="#666"
              value={postText}
              onChangeText={setPostText}
              multiline
              maxLength={500}
              style={{
                padding: 16,
                color: COLORS.text,
                minHeight: 120,
                fontFamily: TEXT_STYLES.body.fontFamily,
                fontSize: TEXT_STYLES.bodyText.fontSize,
                textAlignVertical: "top",
                marginBottom: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.textSecondary,
              }}
            />

            <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary, marginBottom: 20 }}>
              {postText.length}/500 characters
            </Text>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 12 }}>Media Type</Text>
              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                {(["image", "video"] as const).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setMediaType(type)}
                    style={{
                      flex: 1,
                      padding: 14,
                      marginRight: type === "image" ? 8 : 0,
                      borderRadius: 8,
                      backgroundColor: mediaType === type ? COLORS.accent : "transparent",
                      borderWidth: mediaType === type ? 0 : 1,
                      borderColor: COLORS.textSecondary,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ ...TEXT_STYLES.bodyText, color: mediaType === type ? COLORS.background : COLORS.text }}>
                      {type === "image" ? "Photo" : "Video"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                placeholder="Media URL (optional)"
                placeholderTextColor="#666"
                value={mediaUrl}
                onChangeText={setMediaUrl}
                style={{
                  padding: 16,
                  color: COLORS.text,
                  borderRadius: 8,
                  fontFamily: TEXT_STYLES.body.fontFamily,
                  fontSize: TEXT_STYLES.bodyText.fontSize,
                  borderWidth: 1,
                  borderColor: COLORS.textSecondary,
                }}
              />
              <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary, marginTop: 8 }}>
                Add a public photo or video link to attach media to your post.
              </Text>
            </View>

            <Pressable
              onPress={handlePublishPost}
              disabled={loading || (!postText.trim() && !mediaUrl.trim())}
              style={{
                backgroundColor: loading || (!postText.trim() && !mediaUrl.trim()) ? COLORS.textSecondary : COLORS.accent,
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ ...TEXT_STYLES.button }}>
                {loading ? "Publishing..." : "Publish Post"}
              </Text>
            </Pressable>
          </>
        )}

        {/* Group Creation */}
        {tab === "group" && (
          <>
            <Text style={{ ...TEXT_STYLES.subtitle, marginBottom: 20 }}>Create Group</Text>

            <TextInput
              placeholder="Group name"
              placeholderTextColor="#666"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              style={{
                padding: 16,
                color: COLORS.text,
                marginBottom: 12,
                borderRadius: 8,
                fontFamily: TEXT_STYLES.body.fontFamily,
                fontSize: TEXT_STYLES.bodyText.fontSize,
                borderWidth: 1,
                borderColor: COLORS.textSecondary,
              }}
            />
            <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary, marginBottom: 20 }}>
              {groupName.length}/50 characters
            </Text>

            <TextInput
              placeholder="Group description"
              placeholderTextColor="#666"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              maxLength={200}
              style={{
                padding: 16,
                color: COLORS.text,
                minHeight: 100,
                marginBottom: 12,
                borderRadius: 8,
                fontFamily: TEXT_STYLES.body.fontFamily,
                fontSize: TEXT_STYLES.bodyText.fontSize,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: COLORS.textSecondary,
              }}
            />
            <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary, marginBottom: 24 }}>
              {groupDescription.length}/200 characters
            </Text>

            <Pressable
              onPress={handleCreateGroup}
              disabled={loading || !groupName.trim()}
              style={{
                backgroundColor: loading || !groupName.trim() ? COLORS.textSecondary : COLORS.accent,
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ ...TEXT_STYLES.button }}>
                {loading ? "Creating..." : "Create Group"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

