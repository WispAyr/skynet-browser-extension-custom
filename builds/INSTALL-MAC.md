# Skynet Browser Extension - Mac Installation Guide

## Custom Build for Server 10.10.10.123

This is a customized version of the Skynet Browser Extension that connects to server `10.10.10.123:18789` instead of localhost.

## Installation Steps for Mac

### Option 1: Load Unpacked Extension (Recommended)
1. Download and extract `skynet-browser-extension-mac-v1.0.1.zip`
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the extracted folder containing the extension files
6. The Skynet extension should appear in your toolbar

### Option 2: Direct Download
You can also clone the repository and use the modified files directly:
```bash
git clone https://github.com/WispAyr/skynet-browser-extension.git
# The files have been pre-configured for server 10.10.10.123
```

## Verification
1. Click the Skynet extension icon in your toolbar
2. The status should show "CONNECTING" then "CONNECTED" if the server at 10.10.10.123:18789 is reachable
3. You can now use the extension to manage bookmarks and tabs remotely

## Features
- **Bookmark Management**: List, search, add, delete, organize bookmarks
- **Tab Management**: List, create, close, focus, group tabs by domain
- **Remote Control**: WebSocket connection to Skynet/Clawdbot gateway
- **LCARS-styled UI**: Futuristic interface with cyan/orange theme

## Configuration
This build is pre-configured to connect to:
- **Server**: 10.10.10.123
- **Port**: 18789
- **WebSocket Path**: /extension

## Troubleshooting
- Ensure the server at 10.10.10.123:18789 is running and accessible
- Check Chrome's Developer Console for connection errors
- Verify firewall/network allows WebSocket connections to the server

## Version Info
- **Version**: 1.0.1 (custom build)
- **Target Server**: 10.10.10.123:18789
- **Platform**: Mac (Chrome/Chromium)
- **Build Date**: February 5, 2026