const SUPABASE_URL = "https://khsklfanpzheiubjtxyk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2tsZmFucHpoZWl1Ymp0eHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcxMTcsImV4cCI6MjA4NzI4MzExN30.cgII0k1n5xlhiWrGUB_L5ehtutYpvz5RbiIP7nzsmvE";

// Supabase REST helpers (no SDK needed in service worker)
async function getSession() {
  const result = await chrome.storage.local.get("supabase_session");
  return result.supabase_session || null;
}

async function refreshSession(refreshToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };
  await chrome.storage.local.set({ supabase_session: session });
  return session;
}

async function getValidSession() {
  let session = await getSession();
  if (!session) return null;
  // Refresh if token expires within 60 seconds
  if (session.expires_at && session.expires_at - Math.floor(Date.now() / 1000) < 60) {
    session = await refreshSession(session.refresh_token);
  }
  return session;
}

const APP_URL = "https://app.usespara.com";

async function fetchMetadata(url) {
  try {
    const res = await fetch(`${APP_URL}/api/fetch-title?url=${encodeURIComponent(url)}`);
    if (res.ok) return await res.json();
  } catch {}
  return { title: null, image: null };
}

async function insertLink(session, url, title) {
  const metadata = await fetchMetadata(url);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: session.user.id,
      url,
      title: metadata.title || title,
      tags: [],
      image: metadata.image || null,
      read: false,
      favorited: false,
    }),
  });
  return res.ok;
}

function showBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
}

// On extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  const session = await getValidSession();

  if (!session) {
    // Not logged in — open popup for login
    // We can't dynamically set a popup, so open a new tab to login page
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    return;
  }

  // Save current tab
  const url = tab.url;
  const title = tab.title || url;

  // Skip chrome:// and extension pages
  if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
    showBadge("✗", "#ef4444");
    return;
  }

  const ok = await insertLink(session, url, title);
  if (ok) {
    showBadge("✓", "#22c55e");
  } else {
    showBadge("✗", "#ef4444");
  }
});
