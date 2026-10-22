import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

export function LoginScreen({ onSignIn, onSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = isSignUp
      ? await onSignUp(email.trim(), password)
      : await onSignIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Spara</Text>
        <Text style={styles.subtitle}>Your personal link library</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logo: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 40 },
  form: { width: "100%", gap: 12 },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
  },
  button: { backgroundColor: "#fff", borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#000" },
  toggleText: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 8 },
});
