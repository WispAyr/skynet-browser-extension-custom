# Skynet Browser Extension - Enhanced v2.0.0

## 🚀 What's New in v2.0.0

This enhanced version includes powerful new features that make your browser a collaborative workspace with AI:

### ⭐ Major New Features

#### 🤖 **Auto-Bookmarking Intelligence**
- **Smart Detection**: Automatically identifies work-related content
- **AI Analysis**: Uses content analysis, domain recognition, and time-spent heuristics
- **Auto-Organization**: Creates date-based folders and enriched bookmarks
- **Keyword Recognition**: Detects development, documentation, and technical content
- **Session Tracking**: Monitors page engagement and interaction patterns

#### 🤝 **Real-Time Collaboration** 
- **Shared Sessions**: Create collaborative browsing sessions with AI
- **Live Sync**: Real-time scroll synchronization between participants
- **Click Sharing**: See where others are clicking with visual indicators
- **Voice Chat Integration**: Built-in voice communication (planned)
- **Screen Sharing**: Share your screen with collaborators
- **Session Management**: Join, leave, and manage multiple collaborative sessions

#### 🔧 **Advanced Remote Debugging**
- **Live Console**: Execute JavaScript commands remotely
- **Network Monitor**: Track HTTP requests and responses
- **DOM Watcher**: Monitor DOM changes and element interactions
- **Performance Profiler**: Real-time performance metrics
- **Multi-Tab Debugging**: Debug multiple tabs simultaneously
- **Console Interception**: Capture and forward all console output

### 🎯 Enhanced Features

#### 📚 **Smart Bookmark Management**
- **Duplicate Detection**: Automatically finds and manages duplicate bookmarks
- **Intelligent Sorting**: Sort by relevance, date, or alphabetically
- **Cleanup Tools**: Remove broken links and organize folders
- **Search Enhancement**: Advanced search with relevance scoring
- **Export Tools**: Bulk export in multiple formats

#### 🌐 **Advanced Tab Control**
- **Domain Grouping**: Automatically group tabs by domain
- **Inactive Cleanup**: Close tabs that haven't been used
- **Duplicate Management**: Find and merge duplicate tabs
- **Session Restoration**: Save and restore browsing sessions
- **Tab Sharing**: Share specific tabs in collaboration mode

## 🛠️ Installation (Mac)

### Option 1: Download Enhanced Build
1. **Download**: Get `skynet-browser-extension-enhanced-v2.0.0.zip`
2. **Extract**: Unzip to a permanent folder (don't delete after installation)
3. **Chrome Extensions**: Go to `chrome://extensions/`
4. **Developer Mode**: Enable the toggle in top-right
5. **Load Extension**: Click "Load unpacked" → select extracted folder
6. **Pin Extension**: Pin the Skynet icon to your toolbar

### Option 2: Clone Repository
```bash
git clone https://github.com/WispAyr/skynet-browser-extension-custom.git
cd skynet-browser-extension-custom
# Files are pre-configured for 10.10.10.123
```

## ⚙️ Configuration

### Server Connection
- **Server**: 10.10.10.123:18789
- **Protocol**: WebSocket
- **Path**: /extension
- **Auto-reconnect**: Yes (5-second intervals)

### Permissions
- **Bookmarks**: Full read/write access
- **Tabs**: Create, close, focus, group
- **Debugging**: Chrome DevTools protocol access
- **Scripting**: Content script injection
- **History**: Session and navigation tracking
- **Host Access**: All HTTP/HTTPS sites

## 🎮 How to Use

### 🤖 Auto-Bookmarking
1. **Enable**: Click "Auto-Bookmark" in Dashboard
2. **Automatic**: Extension analyzes pages as you browse
3. **Smart Detection**: Recognizes work/development content
4. **Organization**: Creates dated folders automatically
5. **Manual Override**: Disable for specific domains

### 🤝 Collaboration Mode
1. **Start Session**: Click "Share Current Tab" 
2. **Name Session**: Optional custom session name
3. **Invite Participants**: Share session ID
4. **Collaborate**: Real-time interactions synchronized
5. **Tools**: Enable scroll sync, click sharing, voice chat

### 🔧 Remote Debugging
1. **Enable**: Click "Enable Debugging" for current tab
2. **Select Features**: Console, Network, DOM, Performance
3. **Debug Panel**: Opens floating debug interface
4. **Execute Code**: Run JavaScript commands remotely
5. **Monitor**: Real-time console and network logs

## 🎛️ Interface Guide

### Dashboard Tab
- **Quick Actions**: Most common features
- **Session Stats**: Auto-bookmarks, shared tabs, debug sessions
- **Status**: Connection and activity indicators

### Bookmarks Tab
- **Smart Search**: Find bookmarks with context
- **Management Tools**: Duplicates, cleanup, sorting
- **Tree View**: Hierarchical bookmark browser

### Tabs Tab  
- **Tab Overview**: All open tabs with favicons
- **Grouping Tools**: Domain-based organization
- **Cleanup**: Close inactive or duplicate tabs

### Collaboration Tab
- **Active Sessions**: Current shared browsing sessions
- **Session Controls**: Join, leave, manage participants
- **Collaboration Tools**: Sync options and communication

### Debug Tab
- **Session Management**: Active debugging sessions
- **Live Console**: Execute commands and see output
- **Feature Toggles**: Enable specific debugging features
- **Performance**: Real-time metrics and profiling

## 🔐 Security & Privacy

### What Skynet Can Access
- **Current Tab**: Only when explicitly shared or debugged
- **Bookmarks**: Read/write for organization features
- **Page Content**: Only for analysis and collaboration
- **Console Output**: When debugging is enabled
- **Network Requests**: When network monitoring is on

### What Skynet Cannot Access
- **Private Browsing**: Incognito tabs are excluded
- **Passwords**: No access to saved passwords or forms
- **Other Extensions**: Cannot interact with other extensions
- **System**: No file system or OS-level access

### Best Practices
- **Dedicated Profile**: Use a separate Chrome profile for work
- **Session Management**: End shared sessions when done
- **Debug Cleanup**: Disable debugging when not needed
- **Network Awareness**: Be mindful on public networks

## 🚨 Troubleshooting

### Connection Issues
- **Server Check**: Ensure 10.10.10.123:18789 is reachable
- **Firewall**: Allow WebSocket connections
- **Network**: Check for corporate proxy settings
- **Extension**: Try disabling/re-enabling the extension

### Performance Issues
- **Too Many Tabs**: Close unused tabs for better performance
- **Debug Sessions**: Limit concurrent debugging sessions
- **Memory**: Restart Chrome if memory usage is high
- **Network**: Disable features on slow connections

### Feature Problems
- **Auto-Bookmark**: Check if domain is blacklisted
- **Collaboration**: Ensure all participants have same version
- **Debugging**: Verify debugger permissions are granted
- **Sync Issues**: Try refreshing the extension

## 📋 Keyboard Shortcuts

- **Ctrl+Shift+D**: Toggle debug panel
- **Ctrl+Shift+C**: Open collaboration overlay
- **Ctrl+Shift+B**: Quick bookmark current page
- **Ctrl+Shift+S**: Share current tab
- **Enter**: Execute debug command (in debug console)

## 🔄 Version History

### v2.0.0 Enhanced (Current)
- ✨ Auto-bookmarking with AI analysis
- 🤝 Real-time collaboration features  
- 🔧 Advanced remote debugging tools
- 📱 Enhanced popup interface
- 🎯 Smart content analysis
- 🌐 Multi-tab session management

### v1.0.1 Custom
- 🛠️ Server configuration for 10.10.10.123
- 📦 Mac installation package
- 📝 Installation documentation

### v1.0.0 Original
- 📚 Basic bookmark management
- 🌐 Tab control features
- 🔌 WebSocket communication
- 🎨 LCARS-styled interface

## 🆘 Support

### Getting Help
- **Documentation**: Check this README first
- **Console**: Browser DevTools → Console for error messages
- **Extension**: Right-click extension → Inspect popup
- **Background**: chrome://extensions → Service worker

### Reporting Issues
1. **Version**: Include extension version (v2.0.0)
2. **Browser**: Chrome version and OS
3. **Server**: Confirm 10.10.10.123 connectivity
4. **Console**: Include any error messages
5. **Steps**: Detailed reproduction steps

## 🚀 Future Features (Planned)

- **AI Assistant Integration**: Natural language browser control
- **Voice Commands**: "Skynet, bookmark this page"
- **Screen Recording**: Record and share browsing sessions  
- **Mobile Sync**: Sync with mobile browser
- **API Integration**: Connect with external tools and services
- **Advanced Analytics**: Browsing pattern analysis
- **Team Workspaces**: Persistent shared environments

---

**Build**: v2.0.0 Enhanced for Server 10.10.10.123  
**Date**: February 5, 2026  
**Platform**: Mac (Chrome/Chromium)  
**Author**: WispAyr/Skynet Team