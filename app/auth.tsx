import { COLORS, TEXT_STYLES } from "@/constants/fonts";
import { signIn, signUp } from "@/src/services/auth";
import { createUserProfile } from "@/src/services/users";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const login = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (err: any) {
      let errorMessage = "Login failed";
      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Try again later";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await signUp(email, password);
      await createUserProfile(user.uid, email);
      Alert.alert("Success", "Account created successfully!");
    } catch (err: any) {
      console.log("Firebase signup error:", err);
      console.log("Error code:", err.code);
      console.log("Error message:", err.message);

      let errorMessage = "Signup failed";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Check your internet connection";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password authentication is not enabled in Firebase";
      } else if (err.code === "auth/invalid-api-key") {
        errorMessage = "Invalid Firebase API key";
      } else if (err.code === "auth/app-deleted") {
        errorMessage = "Firebase app has been deleted";
      } else if (err.code === "auth/app-not-authorized") {
        errorMessage = "Firebase app is not authorized";
      } else if (err.code === "auth/argument-error") {
        errorMessage = "Invalid arguments provided";
      } else {
        errorMessage = `Signup failed: ${err.message || "Unknown error"}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.background, justifyContent: "center", paddingHorizontal: 24 }}>
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 120, height: 120, marginBottom: 20 }}
        />
      </View>

      <Text style={{ ...TEXT_STYLES.title, marginBottom: 30, textAlign: "center" }}>
        BlackBunny
      </Text>

      {error ? (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.accent, textAlign: "center", marginBottom: 10 }}>
            {error}
          </Text>
          {error.includes("operation-not-allowed") && (
            <Text style={{ ...TEXT_STYLES.bodyText, color: COLORS.textSecondary, fontSize: 12, textAlign: "center" }}>
              Enable Email/Password in Firebase Console → Authentication → Sign-in method
            </Text>
          )}
        </View>
      ) : null}

      <TextInput
        placeholder="email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError("");
        }}
        style={{
          backgroundColor: COLORS.dark,
          padding: 14,
          borderRadius: 10,
          color: COLORS.text,
          marginBottom: 12,
          fontFamily: TEXT_STYLES.body.fontFamily,
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="password"
        placeholderTextColor="#555"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error) setError("");
        }}
        style={{
          backgroundColor: COLORS.dark,
          padding: 14,
          borderRadius: 10,
          color: COLORS.text,
          marginBottom: 20,
          fontFamily: TEXT_STYLES.body.fontFamily,
        }}
      />

      <Pressable
        onPress={login}
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.textSecondary : COLORS.accent,
          padding: 14,
          borderRadius: 10,
          marginBottom: 10,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ ...TEXT_STYLES.button }}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>

      <Pressable
        onPress={signup}
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.textSecondary : COLORS.gold,
          padding: 14,
          borderRadius: 10,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ ...TEXT_STYLES.button, color: COLORS.background }}>
          {loading ? "Signing up..." : "Sign Up"}
        </Text>
      </Pressable>

    </ScrollView>
  );
}
