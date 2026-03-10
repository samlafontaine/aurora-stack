const SUPABASE_URL = "https://khsklfanpzheiubjtxyk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2tsZmFucHpoZWl1Ymp0eHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcxMTcsImV4cCI6MjA4NzI4MzExN30.cgII0k1n5xlhiWrGUB_L5ehtutYpvz5RbiIP7nzsmvE";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const googleBtn = document.getElementById("google-btn");
const errorEl = document.getElementById("error");
const loginForm = document.getElementById("login-form");
const successEl = document.getElementById("success");
const subtitleEl = document.getElementById("subtitle");
const toggleModeBtn = document.getElementById("toggle-mode");
const signupSuccessEl = document.getElementById("signup-success");
const confirmEmailEl = document.getElementById("confirm-email");
const backToSigninBtn = document.getElementById("back-to-signin");

let isSignUp = false;

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

function setMode(signUp) {
  isSignUp = signUp;
  clearError();
  subtitleEl.textContent = isSignUp ? "Create an account to save links" : "Sign in to save links";
  submitBtn.textContent = isSignUp ? "Create account" : "Sign in";
  toggleModeBtn.textContent = isSignUp
    ? "Already have an account? Sign in"
    : "Don't have an account? Sign up";
}

// Toggle between sign-in and sign-up
toggleModeBtn.addEventListener("click", () => {
  setMode(!isSignUp);
});

// Back to sign in from confirmation
backToSigninBtn.addEventListener("click", () => {
  signupSuccessEl.classList.add("hidden");
  loginForm.classList.remove("hidden");
  setMode(false);
});

// Email/password submit (sign in or sign up)
submitBtn.addEventListener("click", async () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Please enter your email and password.");
    return;
  }

  if (isSignUp && password.length < 6) {
    showError("Password must be at least 6 characters.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = isSignUp ? "Creating account\u2026" : "Signing in\u2026";

  try {
    if (isSignUp) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error_description || data.msg || "Could not create account.");
        return;
      }

      // Show confirmation screen
      confirmEmailEl.textContent = email;
      loginForm.classList.add("hidden");
      signupSuccessEl.classList.remove("hidden");
    } else {
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
    }
  } catch {
    showError("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isSignUp ? "Create account" : "Sign in";
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
  if (e.key === "Enter") submitBtn.click();
});

// Check for ?mode=signup query param (linked from save.html)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("mode") === "signup") {
  setMode(true);
}
