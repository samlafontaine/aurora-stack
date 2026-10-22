import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "./src/hooks/useAuth";
import { LoginScreen } from "./src/screens/LoginScreen";
import { FeedScreen } from "./src/screens/FeedScreen";

export default function App() {
  const { user, loading, subscribed, signIn, signUp, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {user ? (
          <FeedScreen userId={user.id} subscribed={subscribed} onSignOut={signOut} />
        ) : (
          <LoginScreen onSignIn={signIn} onSignUp={signUp} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
});
