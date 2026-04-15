import { Text, View } from "react-native";

export default function PostCard({ title, content }: any) {
  return (
    <View style={{
      margin: 15,
      padding: 15,
      backgroundColor: "#111",
      borderRadius: 16,
      borderColor: "#1F1F1F",
      borderWidth: 1
    }}>
      <Text style={{ color: "#fff", fontSize: 18 }}>{title}</Text>
      <Text style={{ color: "#aaa", marginTop: 8 }}>{content}</Text>
    </View>
  );
}