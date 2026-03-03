const SUPABASE_URL = "https://khsklfanpzheiubjtxyk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2tsZmFucHpoZWl1Ymp0eHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcxMTcsImV4cCI6MjA4NzI4MzExN30.cgII0k1n5xlhiWrGUB_L5ehtutYpvz5RbiIP7nzsmvE";
const APP_URL = "https://app.usespara.com";

// --- Session helpers (same as background.js) ---

async function getSession() {
  const result = await chrome.storage.local.get("supabase_session");
  return result.supabase_session || null;
}

async function refreshSession(refreshToken) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );
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
  if (
    session.expires_at &&
    session.expires_at - Math.floor(Date.now() / 1000) < 60
  ) {
    session = await refreshSession(session.refresh_token);
  }
  return session;
}

// --- Metadata ---

async function fetchMetadata(url) {
  try {
    const res = await fetch(
      `${APP_URL}/api/fetch-title?url=${encodeURIComponent(url)}`
    );
    if (res.ok) return await res.json();
  } catch {}
  return { title: null, image: null };
}

// --- Fetch all user tags ---

async function fetchAllTags(session) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/links?select=tags&user_id=eq.${session.user.id}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    const set = new Set();
    for (const row of rows) {
      if (Array.isArray(row.tags)) {
        for (const t of row.tags) set.add(t);
      }
    }
    return [...set].sort();
  } catch {
    return [];
  }
}

// --- DOM refs ---

const loadingEl = document.getElementById("loading");
const authEl = document.getElementById("auth");
const saveFormEl = document.getElementById("save-form");
const successEl = document.getElementById("success");
const signInBtn = document.getElementById("sign-in-btn");
const pageTitleEl = document.getElementById("page-title");
const tagsContainerEl = document.getElementById("tags-container");
const tagInputEl = document.getElementById("tag-input");
const suggestionsEl = document.getElementById("suggestions");
const saveBtn = document.getElementById("save-btn");
const errorEl = document.getElementById("error");

// --- State ---

let selectedTags = [];
let allSuggestions = [];
let tabUrl = "";
let tabTitle = "";
let currentSession = null;

// --- UI helpers ---

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add("visible");
}

function renderTags() {
  // Remove existing tag badges (keep the input)
  tagsContainerEl
    .querySelectorAll(".tag-badge")
    .forEach((el) => el.remove());

  // Insert badges before the input
  for (const tag of selectedTags) {
    const badge = document.createElement("span");
    badge.className = "tag-badge";
    badge.innerHTML = `${tag}<button type="button" aria-label="Remove tag ${tag}">&times;</button>`;
    badge.querySelector("button").addEventListener("click", () => {
      removeTag(tag);
    });
    tagsContainerEl.insertBefore(badge, tagInputEl);
  }

  tagInputEl.placeholder = selectedTags.length === 0 ? "Add tags…" : "";
}

function renderSuggestions() {
  const query = tagInputEl.value.trim().toLowerCase();
  const filtered = allSuggestions.filter(
    (s) => !selectedTags.includes(s) && s.includes(query)
  );

  if (filtered.length === 0) {
    hide(suggestionsEl);
    return;
  }

  suggestionsEl.innerHTML = "";
  for (const tag of filtered) {
    const btn = document.createElement("button");
    btn.className = "suggestion-item";
    btn.textContent = tag;
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => {
      addTag(tag);
      tagInputEl.focus();
    });
    suggestionsEl.appendChild(btn);
  }
  show(suggestionsEl);
}

// --- Tag operations ---

function addTag(value) {
  const tag = value.trim().toLowerCase();
  if (tag && !selectedTags.includes(tag)) {
    selectedTags.push(tag);
    renderTags();
  }
  tagInputEl.value = "";
  renderSuggestions();
}

function removeTag(tag) {
  selectedTags = selectedTags.filter((t) => t !== tag);
  renderTags();
  renderSuggestions();
}

// --- Event listeners ---

tagInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    if (tagInputEl.value.trim()) {
      addTag(tagInputEl.value);
    }
  } else if (
    e.key === "Backspace" &&
    tagInputEl.value === "" &&
    selectedTags.length > 0
  ) {
    selectedTags.pop();
    renderTags();
    renderSuggestions();
  }
});

tagInputEl.addEventListener("input", () => {
  renderSuggestions();
});

tagInputEl.addEventListener("focus", () => {
  renderSuggestions();
});

tagInputEl.addEventListener("blur", () => {
  // Delay so suggestion clicks register
  setTimeout(() => {
    hide(suggestionsEl);
    if (tagInputEl.value.trim()) {
      addTag(tagInputEl.value);
    }
  }, 150);
});

tagsContainerEl.addEventListener("click", () => {
  tagInputEl.focus();
});

signInBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  window.close();
});

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const metadata = await fetchMetadata(tabUrl);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${currentSession.access_token}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: currentSession.user.id,
        url: tabUrl,
        title: metadata.title || tabTitle,
        tags: selectedTags,
        image: metadata.image || null,
        read: false,
        favorited: false,
      }),
    });

    if (!res.ok) {
      showError("Failed to save. Please try again.");
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
      return;
    }

    hide(saveFormEl);
    show(successEl);
    setTimeout(() => window.close(), 600);
  } catch {
    showError("Something went wrong. Please try again.");
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

// --- Init ---

async function init() {
  currentSession = await getValidSession();

  if (!currentSession) {
    hide(loadingEl);
    show(authEl);
    return;
  }

  // Get active tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (
    !tab ||
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://")
  ) {
    hide(loadingEl);
    show(saveFormEl);
    pageTitleEl.textContent = "Cannot save this page";
    saveBtn.disabled = true;
    return;
  }

  tabUrl = tab.url;
  tabTitle = tab.title || tab.url;

  // Fetch suggestions in parallel with UI setup
  const tagsPromise = fetchAllTags(currentSession);

  pageTitleEl.textContent = tabTitle;
  hide(loadingEl);
  show(saveFormEl);

  allSuggestions = await tagsPromise;
  tagInputEl.focus();
}

init();
