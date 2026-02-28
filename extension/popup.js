const SUPABASE_URL = "https://khsklfanpzheiubjtxyk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2tsZmFucHpoZWl1Ymp0eHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcxMTcsImV4cCI6MjA4NzI4MzExN30.cgII0k1n5xlhiWrGUB_L5ehtutYpvz5RbiIP7nzsmvE";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInBtn = document.getElementById("sign-in-btn");
const googleBtn = document.getElementById("google-btn");
const errorEl = document.getElementById("error");
const loginForm = document.getElementById("login-form");
const successEl = document.getElementById("success");

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add("visible");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.remove("visible");
}

async function saveSession(data) {
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };
  await chrome.storage.local.set({ supabase_session: session });
}

function showSuccess() {
  loginForm.classList.add("hidden");
  successEl.classList.remove("hidden");
}

// Email/password sign in
signInBtn.addEventListener("click", async () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Please enter your email and password.");
    return;
  }

  signInBtn.disabled = true;
  signInBtn.textContent = "Signing in…";

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error_description || data.msg || "Invalid credentials.");
      return;
    }

    await saveSession(data);
    showSuccess();
  } catch {
    showError("Something went wrong. Please try again.");
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = "Sign in";
  }
});

// Google OAuth
googleBtn.addEventListener("click", async () => {
  clearError();

  const redirectUrl = chrome.identity.getRedirectURL();
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectUrl,
  });

  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?${params}`;

  try {
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });

    // Supabase redirects back with access_token and refresh_token in the hash
    const url = new URL(responseUrl);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const expiresIn = parseInt(hashParams.get("expires_in") || "3600");

    if (!accessToken) {
      showError("Google sign-in failed. Please try again.");
      return;
    }

    // Get user info
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = await userRes.json();

    await chrome.storage.local.set({
      supabase_session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      },
    });

    showSuccess();
  } catch {
    showError("Google sign-in was cancelled or failed.");
  }
});

// Allow Enter key to submit
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") signInBtn.click();
});
