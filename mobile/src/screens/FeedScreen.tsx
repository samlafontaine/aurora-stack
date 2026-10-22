import { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import PagerView from "react-native-pager-view";
import { LinkCard } from "../components/LinkCard";
import { useLinks, Link } from "../hooks/useLinks";
import { ReaderScreen } from "./ReaderScreen";

const FREE_LIMIT = 20;

interface FeedScreenProps {
  userId: string;
  subscribed: boolean;
  onSignOut: () => void;
}

type Tab = "unread" | "read" | "favorites";
const TAB_ORDER: Tab[] = ["unread", "read", "favorites"];

export function FeedScreen({ userId, subscribed, onSignOut }: FeedScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    links,
    loading,
    addLink,
    deleteLink,
    markRead,
    markUnread,
    toggleFavorite,
    refresh,
  } = useLinks(userId);

  const [activeTab, setActiveTab] = useState<Tab>("unread");
  const [refreshing, setRefreshing] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [readingLink, setReadingLink] = useState<Link | null>(null);
  const pagerRef = useRef<PagerView>(null);

  const unread = useMemo(() => links.filter((l) => !l.read), [links]);
  const read = useMemo(() => links.filter((l) => l.read), [links]);
  const favorites = useMemo(() => links.filter((l) => l.favorited), [links]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleAdd = async () => {
    const trimmed = addUrl.trim();
    if (!trimmed) return;

    let url = trimmed;
    if (!url.startsWith("http://") && !url.startsWith("https://"))
      url = "https://" + url;

    try {
      new URL(url);
    } catch {
      Alert.alert("Invalid URL");
      return;
    }

    setAdding(true);
    let title: string;
    try {
      const res = await fetch(
        `https://app.usespara.com/api/fetch-title?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();
      title = data.title || new URL(url).hostname;
    } catch {
      title = new URL(url).hostname;
    }

    await addLink({ url, title, tags: [], image: null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddUrl("");
    setAdding(false);
    setAddModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete link?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteLink(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleMarkRead = (id: string) => {
    markRead(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMarkUnread = (id: string) => {
    markUnread(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Sign out"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) onSignOut();
        }
      );
    } else {
      Alert.alert("Settings", undefined, [
        { text: "Sign out", style: "destructive", onPress: onSignOut },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleTabPress = (tab: Tab) => {
    const idx = TAB_ORDER.indexOf(tab);
    pagerRef.current?.setPage(idx);
    setActiveTab(tab);
    Haptics.selectionAsync();
  };

  const handlePageSelected = (e: any) => {
    const idx = e.nativeEvent.position;
    setActiveTab(TAB_ORDER[idx]);
    Haptics.selectionAsync();
  };

  const handleFabPress = () => {
    if (!subscribed && links.length >= FREE_LIMIT) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Free limit reached",
        `You've saved ${links.length} of ${FREE_LIMIT} free links. Upgrade to Pro for unlimited links.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => Linking.openURL("https://app.usespara.com"),
          },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAddModalVisible(true);
  };

  const currentReadingLink = readingLink
    ? (links.find((l) => l.id === readingLink.id) ?? readingLink)
    : null;

  if (currentReadingLink) {
    return (
      <ReaderScreen
        link={currentReadingLink}
        onBack={() => setReadingLink(null)}
        onMarkRead={handleMarkRead}
        onMarkUnread={handleMarkUnread}
        onToggleFavorite={handleToggleFavorite}
        onDelete={(id: string) => {
          handleDelete(id);
        }}
      />
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "unread", label: "Unread", count: unread.length },
    { key: "read", label: "Read", count: read.length },
    { key: "favorites", label: "Favorites", count: favorites.length },
  ];

  const usageRatio = !subscribed ? links.length / FREE_LIMIT : 0;

  const renderList = (data: Link[], emptyMessage: string) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <LinkCard
          link={item}
          onPress={setReadingLink}
          onDelete={handleDelete}
          onMarkRead={handleMarkRead}
          onMarkUnread={handleMarkUnread}
          onToggleFavorite={handleToggleFavorite}
          onLongPress={handleLongPress}
        />
      )}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: insets.bottom + 80 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : undefined
      }
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Spara</Text>
          {!subscribed && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL("https://app.usespara.com");
              }}
              style={styles.usageRingContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.usageRing}>
                <View style={styles.usageRingTrack}>
                  <View
                    style={[
                      styles.usageRingFill,
                      {
                        width: `${Math.min(100, usageRatio * 100)}%`,
                        backgroundColor: usageRatio >= 1 ? "#ef4444" : usageRatio >= 0.8 ? "#f59e0b" : "#666",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.usageText, usageRatio >= 1 && { color: "#ef4444" }]}>
                  {links.length}/{FREE_LIMIT}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => handleTabPress(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
              {tab.count > 0 ? ` ${tab.count}` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="unread">{renderList(unread, "No unread links")}</View>
        <View key="read">{renderList(read, "Nothing read yet")}</View>
        <View key="favorites">{renderList(favorites, "No favorites")}</View>
      </PagerView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={handleFabPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Add link modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add a link</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="Paste a URL..."
                placeholderTextColor="#555"
                value={addUrl}
                onChangeText={setAddUrl}
                autoCapitalize="none"
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleAdd}
                editable={!adding}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, adding && styles.modalButtonDisabled]}
              onPress={handleAdd}
              disabled={adding || !addUrl.trim()}
            >
              <Text style={styles.modalButtonText}>
                {adding ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: { fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: -0.5 },
  usageRingContainer: {},
  usageRing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  usageRingTrack: {
    width: 32,
    height: 3,
    backgroundColor: "#222",
    borderRadius: 2,
    overflow: "hidden",
  },
  usageRingFill: {
    height: 3,
    borderRadius: 2,
  },
  usageText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#111",
  },
  activeTab: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, color: "#666", fontWeight: "500" },
  activeTabText: { color: "#000" },
  pager: { flex: 1 },
  list: { paddingHorizontal: 16 },
  empty: { paddingTop: 80, alignItems: "center" },
  emptyText: { color: "#444", fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  modalInputRow: { marginBottom: 16 },
  modalInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
  },
  modalButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  modalButtonDisabled: { opacity: 0.5 },
  modalButtonText: { fontSize: 16, fontWeight: "600", color: "#000" },
});
