import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Share,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import type { Link } from "../hooks/useLinks";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 100;
const EDGE_WIDTH = 24;

interface ReaderScreenProps {
  link: Link;
  onBack: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

interface Article {
  title: string;
  content: string;
  siteName: string | null;
  excerpt: string | null;
}

const SCROLL_JS = `
  (function() {
    var scheduled = false;
    window.addEventListener('scroll', function() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(function() {
          var scrollTop = window.scrollY;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var progress = docHeight <= 0 ? 100 : Math.min(100, (scrollTop / docHeight) * 100);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', progress: progress }));
          scheduled = false;
        });
      }
    }, { passive: true });
  })();
  true;
`;

function buildHtml(article: Article) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      font-family: -apple-system, system-ui, sans-serif;
      background: #000;
      color: rgba(255,255,255,0.88);
      padding: 24px 20px 80px;
      font-size: 18px;
      line-height: 1.75;
      -webkit-font-smoothing: antialiased;
      -webkit-overflow-scrolling: touch;
      overflow-y: scroll;
    }
    h1.article-title {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.4px;
      color: #fff;
      margin-bottom: 6px;
    }
    .site-name {
      font-size: 14px;
      color: #666;
      margin-bottom: 32px;
    }
    .reader-content h1, .reader-content h2, .reader-content h3,
    .reader-content h4, .reader-content h5, .reader-content h6 {
      color: #fff;
      margin-top: 32px;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .reader-content h2 { font-size: 22px; }
    .reader-content h3 { font-size: 19px; }
    .reader-content p { margin-bottom: 18px; }
    .reader-content a { color: #6cb4ee; text-decoration: underline; }
    .reader-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 16px 0;
    }
    .reader-content ul, .reader-content ol {
      padding-left: 24px;
      margin-bottom: 18px;
    }
    .reader-content li { margin-bottom: 8px; }
    .reader-content blockquote {
      border-left: 3px solid #333;
      padding-left: 16px;
      margin: 18px 0;
      color: rgba(255,255,255,0.55);
      font-style: italic;
    }
    .reader-content pre {
      background: #111;
      border-radius: 8px;
      padding: 14px;
      overflow-x: auto;
      margin: 18px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .reader-content code {
      background: #111;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 15px;
    }
    .reader-content pre code { background: none; padding: 0; }
    .reader-content figure { margin: 18px 0; }
    .reader-content figcaption {
      font-size: 13px;
      color: #666;
      text-align: center;
      margin-top: 8px;
    }
    .reader-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
    }
    .reader-content th, .reader-content td {
      border: 1px solid #222;
      padding: 8px 12px;
      text-align: left;
      font-size: 15px;
    }
    .reader-content th { background: #111; color: #fff; }
  </style>
</head>
<body>
  <h1 class="article-title">${escapeHtml(article.title)}</h1>
  <p class="site-name">${escapeHtml(article.siteName || "")}</p>
  <div class="reader-content">${article.content}</div>
</body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ReaderScreen({
  link,
  onBack,
  onMarkRead,
  onMarkUnread,
  onToggleFavorite,
}: ReaderScreenProps) {
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        gestureState.moveX < EDGE_WIDTH + 20 &&
        gestureState.dx > 10 &&
        Math.abs(gestureState.dy) < Math.abs(gestureState.dx),
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dx > 0) translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(onBack);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    fetch(
      `https://app.usespara.com/api/fetch-article?url=${encodeURIComponent(link.url)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setArticle(data);
      })
      .catch(() => setError("Failed to load article"))
      .finally(() => setLoading(false));
  }, [link.url]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "scroll") {
        Animated.timing(progressAnim, {
          toValue: data.progress,
          duration: 120,
          useNativeDriver: false,
        }).start();
      }
    } catch {}
  };

  const handleShare = async () => {
    try {
      await Share.share({ url: link.url, message: link.title });
    } catch {}
  };

  const hostname = (() => {
    try {
      return new URL(link.url).hostname.replace("www.", "");
    } catch {
      return link.url;
    }
  })();

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top, transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
      </View>

      {/* Minimal header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.hostname} numberOfLines={1}>
          {hostname}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : error || !article ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error || "Could not parse article"}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(link.url)}
            style={styles.originalLink}
          >
            <Text style={styles.originalLinkText}>View original page</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ html: buildHtml(article) }}
          style={styles.webview}
          injectedJavaScript={SCROLL_JS}
          onMessage={handleMessage}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="normal"
          bounces
          originWhitelist={["*"]}
          allowsInlineMediaPlayback
          onShouldStartLoadWithRequest={(request) => {
            if (
              request.url !== "about:blank" &&
              !request.url.startsWith("data:")
            ) {
              Linking.openURL(request.url);
              return false;
            }
            return true;
          }}
        />
      )}

      {/* Bottom toolbar */}
      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity
          onPress={() =>
            link.read ? onMarkUnread(link.id) : onMarkRead(link.id)
          }
          style={styles.toolbarButton}
        >
          <Ionicons
            name={link.read ? "checkmark-circle" : "checkmark-circle-outline"}
            size={22}
            color={link.read ? "#fff" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onToggleFavorite(link.id)}
          style={styles.toolbarButton}
        >
          <Ionicons
            name={link.favorited ? "star" : "star-outline"}
            size={22}
            color={link.favorited ? "#facc15" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.toolbarButton}>
          <Ionicons name="share-outline" size={22} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL(link.url)}
          style={styles.toolbarButton}
        >
          <Ionicons name="open-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  progressTrack: { height: 2, backgroundColor: "transparent" },
  progressBar: { height: 2, backgroundColor: "rgba(255,255,255,0.7)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: { padding: 4 },
  hostname: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  originalLink: { paddingVertical: 8 },
  originalLinkText: {
    color: "#fff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  webview: { flex: 1, backgroundColor: "#000" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#222",
    backgroundColor: "#000",
  },
  toolbarButton: {
    width: 48,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
