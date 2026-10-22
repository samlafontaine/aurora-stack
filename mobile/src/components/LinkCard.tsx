import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import type { Link } from "../hooks/useLinks";

interface LinkCardProps {
  link: Link;
  onPress: (link: Link) => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onLongPress?: () => void;
}

export function LinkCard({ link, onPress, onDelete, onMarkRead, onMarkUnread, onToggleFavorite, onLongPress }: LinkCardProps) {
  const hostname = (() => {
    try { return new URL(link.url).hostname.replace("www.", ""); }
    catch { return link.url; }
  })();

  const handlePress = () => {
    onPress(link);
  };

  const handleLongPress = () => {
    onLongPress?.();
    Alert.alert(link.title, undefined, [
      { text: link.read ? "Mark unread" : "Mark read", onPress: () => link.read ? onMarkUnread(link.id) : onMarkRead(link.id) },
      { text: link.favorited ? "Unfavorite" : "Favorite", onPress: () => onToggleFavorite(link.id) },
      { text: "Delete", style: "destructive", onPress: () => onDelete(link.id) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} onLongPress={handleLongPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>{link.title}</Text>
          <Text style={styles.hostname}>{hostname}</Text>
          {link.tags.length > 0 && (
            <View style={styles.tags}>
              {link.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {link.image && <Image source={{ uri: link.image }} style={styles.thumbnail} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111", borderRadius: 12, padding: 16, marginBottom: 8 },
  content: { flexDirection: "row", gap: 12 },
  textContent: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: "600", color: "#fff", lineHeight: 22 },
  hostname: { fontSize: 13, color: "#666" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tag: { backgroundColor: "#222", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 12, color: "#888" },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#222" },
});
