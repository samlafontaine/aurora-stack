# Shareable Reader Mode Links

## Approach
No Supabase storage needed. The `/read?url=...` page already works without auth (the API just proxies and parses the article). Sharing = copying the page URL with a `shared=1` param appended.

## Changes

### 1. `src/app/read/page.tsx` — Add share button + shared mode
- Add a **share icon button** in the header (between "Go to article" and "Toggle theme") with a "Share article" tooltip
- On click: copies `{origin}/read?url=...&shared=1` to clipboard, shows checkmark for 2s (same pattern as the favorites share button on the home page)
- Read a `shared` query param from the URL:
  - When `shared=1`: hide the "← Back" link (it would go to `/` which requires login), and show a **sign-up footer** at the bottom of the article
  - When not shared (normal reader mode): keep "← Back" and no footer (user is the owner)
- The **sign-up footer** matches the existing share page style:
  ```
  "Save and share your own favorite links. Create a free account"
  ```

### Files touched
- `src/app/read/page.tsx` — all changes live here (share button, shared param logic, footer)

No new files, no new dependencies, no database changes.
