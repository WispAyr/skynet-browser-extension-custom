# Skynet Browser Manager

Chrome extension for remote browser management via Skynet/Clawdbot.

## Features

### Bookmark Management
- List all bookmarks (tree structure)
- Search bookmarks
- Add/delete bookmarks
- Move and organize bookmarks
- Find duplicate bookmarks

### Tab Management
- List all open tabs
- Focus/activate tabs
- Close tabs
- Group tabs by domain

### Remote Control
- WebSocket connection to Clawdbot gateway (localhost:18789)
- Full command/response protocol
- Auto-reconnect on disconnect
- Status indicator in popup

## Installation

### 1. Load as Unpacked Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this folder (`skynet-browser-extension`)
5. The extension icon should appear in your toolbar

### 2. Verify Connection

1. Ensure Clawdbot gateway is running on `localhost:18789`
2. Click the extension icon
3. Status should show **CONNECTED** (green dot)

## WebSocket Protocol

The extension connects to `ws://localhost:18789/extension` and communicates via JSON messages.

### Commands (from Clawdbot → Extension)

```json
// Bookmark operations
{"action": "bookmarks.list"}
{"action": "bookmarks.search", "query": "github"}
{"action": "bookmarks.add", "url": "https://example.com", "title": "Example", "folder": "Tech"}
{"action": "bookmarks.delete", "id": "123"}
{"action": "bookmarks.move", "id": "123", "parentId": "456", "index": 0}
{"action": "bookmarks.duplicates"}

// Tab operations
{"action": "tabs.list"}
{"action": "tabs.create", "url": "https://example.com", "active": true}
{"action": "tabs.close", "tabId": 123}
{"action": "tabs.close", "tabIds": [123, 456]}
{"action": "tabs.focus", "tabId": 123}
{"action": "tabs.groupByDomain"}

// Status
{"action": "status"}
```

### Responses (from Extension → Clawdbot)

```json
// Success
{"success": true, "action": "bookmarks.list", "data": {...}}

// Error
{"success": false, "action": "bookmarks.delete", "error": "Bookmark ID required"}
```

### Request IDs

Include `requestId` in commands to correlate responses:

```json
// Request
{"action": "tabs.list", "requestId": "abc123"}

// Response
{"success": true, "action": "tabs.list", "requestId": "abc123", "data": [...]}
```

## Popup UI

The extension popup provides:
- **Status indicator** - Connection state to gateway
- **Bookmarks tab** - Browse and search bookmarks
- **Tabs tab** - View and manage open tabs
- **Tools tab** - Find duplicates, group by domain, export data

## Permissions

- `bookmarks` - Read/write bookmarks
- `tabs` - Read/manage tabs
- `storage` - Store extension settings
- `activeTab` - Access current tab

## Styling

LCARS-inspired theme with:
- Cyan (#00d4ff) and Orange (#ff9500) accents
- Dark background (#000000)
- Rounded corners and smooth transitions

## Development

### Project Structure

```
skynet-browser-extension/
├── manifest.json      # Extension manifest (v3)
├── background.js      # Service worker - WebSocket + commands
├── popup.html         # Popup UI structure
├── popup.js           # Popup logic
├── popup.css          # LCARS styling
├── icons/             # Extension icons
└── README.md          # This file
```

### Debugging

1. Open `chrome://extensions/`
2. Click **Inspect views: service worker** to debug background.js
3. Right-click popup → **Inspect** to debug popup

### Logs

Background service worker logs connection status and messages:
- `[Skynet] Connecting to gateway...`
- `[Skynet] Connected to gateway`
- `[Skynet] Received: {...}`

## Version History

### v1.0.0
- Initial release
- Bookmark management (list, search, add, delete, move, duplicates)
- Tab management (list, create, close, focus, group by domain)
- WebSocket communication with Clawdbot gateway
- LCARS-styled popup UI
