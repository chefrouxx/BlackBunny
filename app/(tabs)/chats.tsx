import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { auth } from "@/src/firebase/config";
import { ChatMessage, DirectMessage, getUserDirectMessages, sendDirectMessage, subscribeToChatMessages } from "@/src/services/chats";
import { acceptFriendRequest, declineFriendRequest, getFriendRequests, getFriends, searchUsers, sendFriendRequest } from "@/src/services/friends";
import { getUserProfile } from "@/src/services/users";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";

interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted";
  createdAt: number;
  username?: string;
  email?: string;
}

export default function Friends() {
  const [tab, setTab] = useState<"search" | "requests" | "friends" | "messages">("friends");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (!hasInitialized && auth.currentUser) {
      loadInitialData();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const loadInitialData = async () => {
    try {
      const requests = await getFriendRequests(auth.currentUser?.uid || "");
      
      // Enrich requests with user data
      const enrichedRequests = await Promise.all(
        requests.map(async (req) => {
          const profile = await getUserProfile(req.userId);
          return {
            ...req,
            username: profile?.username || "Unknown",
            email: profile?.email || "",
          };
        })
      );
      
      setFriendRequests(enrichedRequests);
      
      const friends = await getFriends(auth.currentUser?.uid || "");
      setFriendsList(friends);

      const messages = await getUserDirectMessages(auth.currentUser?.uid || "");
      setDirectMessages(messages);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (hasInitialized) {
        loadInitialData();
      }
    }, [hasInitialized])
  );

  const handleSearch = async (text: string) => {
    setSearchTerm(text);

    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(text, auth.currentUser?.uid || "");
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(auth.currentUser?.uid || "", userId);
      Alert.alert("Success", "Friend request sent!");
      setSearchResults([]);
      setSearchTerm("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    }
  };

  const handleAcceptRequest = async (requestId: string, userId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert("Success", "Friend request accepted!");
      await loadInitialData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      await loadInitialData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to decline request");
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const chatId = await sendDirectMessage(friendId, "👋", user.uid, "You", "text");
      setSelectedChat(chatId);
      setTab("messages");
      await loadInitialData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start chat");
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Find the recipient from the selected chat
      const chat = directMessages.find(dm => dm.id === selectedChat);
      if (!chat) return;

      const recipientId = chat.participants.find(id => id !== user.uid);
      if (!recipientId) return;

      await sendDirectMessage(recipientId, messageText, user.uid, "You", "text");
      setMessageText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send message");
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    // Subscribe to messages for this chat
    const unsubscribe = subscribeToChatMessages(chatId, (messages) => {
      setChatMessages(messages);
    });
    // Store unsubscribe function for cleanup
    return unsubscribe;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Tab Selector */}
      <View style={{ flexDirection: "row", padding: 24, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.textSecondary }}>
        <Pressable
          onPress={() => setTab("friends")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: tab === "friends" ? 3 : 0,
            borderBottomColor: COLORS.accent,
            alignItems: "center",
          }}
        >
          <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: tab === "friends" ? "700" : "400" }}>
            Friends
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab("messages")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: tab === "messages" ? 3 : 0,
            borderBottomColor: COLORS.accent,
            alignItems: "center",
          }}
        >
          <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: tab === "messages" ? "700" : "400" }}>
            Messages ({directMessages.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab("requests")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: tab === "requests" ? 3 : 0,
            borderBottomColor: COLORS.accent,
            alignItems: "center",
          }}
        >
          <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: tab === "requests" ? "700" : "400" }}>
            Requests ({friendRequests.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab("search")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: tab === "search" ? 3 : 0,
            borderBottomColor: COLORS.accent,
            alignItems: "center",
          }}
        >
          <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: tab === "search" ? "700" : "400" }}>
            Search
          </Text>
        </Pressable>
      </View>

      {/* Search Tab */}
      {tab === "search" && (
        <ScrollView style={{ flex: 1, padding: 24 }}>
          <TextInput
            placeholder="Search by username..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={handleSearch}
            style={{
              padding: 16,
              color: COLORS.text,
              marginBottom: 20,
              borderRadius: 8,
              fontFamily: TEXT_STYLES.body.fontFamily,
              fontSize: TEXT_STYLES.bodyText.fontSize,
              borderWidth: 1,
              borderColor: COLORS.textSecondary,
            }}
          />

          {loading && <Text style={{ ...TEXT_STYLES.bodyText, textAlign: "center", marginTop: 20 }}>Searching...</Text>}

          {searchResults.length === 0 && searchTerm.length > 0 && !loading && (
            <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center", marginTop: 20 }}>
              No users found
            </Text>
          )}

          {searchResults.map((user) => (
            <View
              key={user.uid}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.textSecondary,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700" }}>{user.username}</Text>
                <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary }}>{user.email}</Text>
              </View>

              <Pressable
                onPress={() => handleSendFriendRequest(user.uid)}
                style={{
                  backgroundColor: COLORS.accent,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, fontWeight: "700", color: COLORS.background }}>
                  Add
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
          renderItem={({ item }) => (
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 12,
                marginBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.textSecondary,
              }}
            >
              <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700", marginBottom: 4 }}>
                {item.username}
              </Text>
              <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
                {item.email}
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => handleAcceptRequest(item.id, item.userId)}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.accent,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700", fontSize: 12, color: COLORS.background }}>
                    Accept
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeclineRequest(item.id)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: COLORS.textSecondary,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700", fontSize: 12 }}>
                    Decline
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 20, marginTop: 24 }}>
              <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center" }}>
                No friend requests
              </Text>
            </View>
          }
        />
      )}

      {/* Friends Tab */}
      {tab === "friends" && (
        <FlatList
          data={friendsList}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
          renderItem={({ item }) => (
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 12,
                marginBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.textSecondary,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700" }}>
                    {item.username}
                  </Text>
                  <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, color: COLORS.textSecondary }}>
                    {item.email}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleStartChat(item.uid)}
                  style={{
                    backgroundColor: COLORS.accent,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 12, fontWeight: "700", color: COLORS.background }}>
                    Message
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 20, marginTop: 24 }}>
              <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center" }}>
                No friends yet. Search and add some!
              </Text>
            </View>
          }
        />
      )}

      {/* Messages Tab */}
      {tab === "messages" && (
        <View style={{ flex: 1 }}>
          {!selectedChat ? (
            <FlatList
              data={directMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
              renderItem={({ item }) => {
                const otherParticipantId = item.participants.find(id => id !== auth.currentUser?.uid);
                const otherParticipant = friendsList.find(friend => friend.uid === otherParticipantId);

                return (
                  <Pressable
                    onPress={() => {
                      handleSelectChat(item.id);
                    }}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      marginBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.textSecondary,
                      backgroundColor: selectedChat === item.id ? COLORS.accent + '20' : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700" }}>
                          {otherParticipant?.username || "Unknown User"}
                        </Text>
                        <Text
                          style={{
                            ...TEXT_STYLES.bodyText,
                            fontSize: 12,
                            color: COLORS.textSecondary,
                            marginTop: 4
                          }}
                          numberOfLines={1}
                        >
                          {item.lastMessage?.text || "Start a conversation..."}
                        </Text>
                      </View>
                      {item.unreadCount[auth.currentUser?.uid || ''] > 0 && (
                        <View style={{
                          backgroundColor: COLORS.accent,
                          borderRadius: 10,
                          minWidth: 20,
                          height: 20,
                          justifyContent: "center",
                          alignItems: "center",
                          paddingHorizontal: 6,
                        }}>
                          <Text style={{ ...TEXT_STYLES.bodyText, fontSize: 10, color: COLORS.background, fontWeight: "700" }}>
                            {item.unreadCount[auth.currentUser?.uid || '']}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, marginTop: 24 }}>
                  <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, textAlign: "center" }}>
                    No messages yet. Start chatting with your friends!
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={{ flex: 1 }}>
              {/* Chat Header */}
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.textSecondary,
              }}>
                <Pressable onPress={() => setSelectedChat(null)}>
                  <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.accent }}>← Back</Text>
                </Pressable>
                <Text style={{ ...TEXT_STYLES.bodyText, fontWeight: "700" }}>
                  {(() => {
                    const chat = directMessages.find(dm => dm.id === selectedChat);
                    const otherParticipantId = chat?.participants.find(id => id !== auth.currentUser?.uid);
                    const otherParticipant = friendsList.find(friend => friend.uid === otherParticipantId);
                    return otherParticipant?.username || "Chat";
                  })()}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Messages List */}
              <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => {
                  const isOwnMessage = item.userId === auth.currentUser?.uid;
                  return (
                    <View style={{
                      flexDirection: isOwnMessage ? "row-reverse" : "row",
                      marginBottom: 12,
                      alignItems: "flex-end",
                    }}>
                      <View style={{
                        maxWidth: "70%",
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: isOwnMessage ? COLORS.accent : COLORS.dark,
                      }}>
                        <Text style={{
                          ...TEXT_STYLES.bodyText,
                          color: isOwnMessage ? COLORS.background : COLORS.text
                        }}>
                          {item.text}
                        </Text>
                        <Text style={{
                          ...TEXT_STYLES.bodyText,
                          fontSize: 10,
                          color: isOwnMessage ? COLORS.background + '80' : COLORS.textSecondary,
                          marginTop: 4,
                          textAlign: isOwnMessage ? "right" : "left"
                        }}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  );
                }}
                inverted={false}
                onContentSizeChange={() => {
                  // Auto scroll to bottom for new messages
                }}
              />

              {/* Message Input */}
              <View style={{
                flexDirection: "row",
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: COLORS.textSecondary,
                backgroundColor: COLORS.background,
              }}>
                <TextInput
                  placeholder="Type a message..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={messageText}
                  onChangeText={setMessageText}
                  style={{
                    flex: 1,
                    padding: 12,
                    color: COLORS.text,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: COLORS.textSecondary,
                    marginRight: 12,
                    fontFamily: TEXT_STYLES.body.fontFamily,
                    fontSize: TEXT_STYLES.bodyText.fontSize,
                  }}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  onPress={handleSendMessage}
                  disabled={!messageText.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: messageText.trim() ? COLORS.accent : COLORS.textSecondary,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.background, fontSize: 16 }}>→</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

