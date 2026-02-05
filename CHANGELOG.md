# Changelog - Skynet Browser Extension

All notable changes to the Skynet Browser Extension are documented here.

## [2.0.0] - 2026-02-05 - Enhanced Release

### 🚀 Major New Features

#### Auto-Bookmarking Intelligence
- **Smart Content Detection**: Automatically identifies work-related pages using AI analysis
- **Keyword Recognition**: Detects development, documentation, and technical content
- **Domain Intelligence**: Recognizes work-related domains (GitHub, Stack Overflow, AWS, etc.)
- **Session Tracking**: Monitors time spent and user interactions
- **Auto-Organization**: Creates date-based folders with enriched bookmark titles
- **Confidence Scoring**: Uses multiple factors to determine bookmark worthiness

#### Real-Time Collaboration
- **Shared Sessions**: Create and manage collaborative browsing sessions
- **Live Scroll Sync**: Real-time scroll synchronization between participants
- **Click Sharing**: Visual indicators show where collaborators are clicking
- **Session Management**: Join, leave, and monitor multiple active sessions
- **Participant Tracking**: See who's in each session and their activity
- **Collaboration Overlay**: Floating interface with session controls and activity feed

#### Advanced Remote Debugging
- **Live Console**: Execute JavaScript commands remotely with real-time output
- **Network Monitoring**: Track HTTP requests and responses in real-time
- **DOM Watcher**: Monitor DOM changes and element interactions
- **Performance Profiler**: Real-time performance metrics and analysis
- **Multi-Tab Support**: Debug multiple tabs simultaneously
- **Console Interception**: Capture all console.log/error/warn output

### ⭐ Enhanced Features

#### Bookmark Management
- **Duplicate Detection**: Smart algorithm to find and manage duplicate bookmarks
- **Intelligent Sorting**: Sort by relevance, date, domain, or alphabetically
- **Cleanup Tools**: Remove broken links and reorganize folder structures
- **Advanced Search**: Context-aware search with relevance scoring
- **Bulk Operations**: Mass edit, move, or delete bookmarks

#### Tab Management  
- **Domain Grouping**: Automatically group tabs by website domain
- **Inactive Cleanup**: Identify and close tabs that haven't been used
- **Duplicate Detection**: Find and merge tabs with identical URLs
- **Session Restoration**: Save and restore complete browsing sessions
- **Tab Sharing**: Share specific tabs in collaboration mode

#### User Interface
- **Enhanced Popup**: Redesigned with 5-tab interface (Dashboard, Bookmarks, Tabs, Collaboration, Debug)
- **Real-Time Stats**: Live counters for auto-bookmarks, shared sessions, debug sessions
- **Connection Monitor**: Real-time connection status and uptime tracking
- **LCARS Styling**: Enhanced Star Trek-inspired visual design
- **Responsive Layout**: Optimized for different screen sizes

### 🛠️ Technical Improvements

#### Architecture
- **Content Scripts**: Advanced page analysis and interaction tracking
- **Enhanced Permissions**: Added debugger, scripting, history, and host permissions
- **WebSocket Protocol**: Extended message types for new features
- **Session Management**: Persistent session state and recovery
- **Error Handling**: Improved error reporting and recovery

#### Performance
- **Optimized Analysis**: Efficient page content analysis algorithms
- **Memory Management**: Better cleanup of sessions and resources
- **Background Processing**: Non-blocking operations for better UX
- **Caching**: Smart caching of analysis results and session data

#### Security
- **Isolated Sessions**: Each collaboration session is properly isolated
- **Permission Model**: Granular permissions for different features
- **Data Validation**: Enhanced input validation and sanitization
- **Secure Communication**: Encrypted WebSocket communication

### 🎮 User Experience

#### Dashboard
- Quick access to all major features
- Real-time statistics and activity monitoring
- One-click enable/disable for auto-features
- Visual status indicators and health checks

#### Collaboration Tools
- Session creation with custom names
- Participant management and activity tracking
- Tool toggles for sync features (scroll, clicks, voice, screen)
- Real-time activity feed and notifications

#### Debug Interface
- Feature toggles for different debug capabilities
- Live console with command execution
- Session list with attach/detach controls
- Real-time log streaming and filtering

### 📋 New Keyboard Shortcuts
- **Ctrl+Shift+D**: Toggle debug panel
- **Ctrl+Shift+C**: Open collaboration overlay  
- **Ctrl+Shift+B**: Quick bookmark current page
- **Ctrl+Shift+S**: Share current tab

### 🐛 Bug Fixes
- Fixed WebSocket reconnection logic
- Improved bookmark tree rendering performance
- Fixed tab focus issues in popup interface
- Resolved memory leaks in long-running sessions
- Fixed CSS conflicts with host pages

### 🔧 Configuration
- Server endpoint: 10.10.10.123:18789
- Enhanced WebSocket protocol with new message types
- Configurable auto-bookmark sensitivity
- Debug feature toggles
- Collaboration tool preferences

## [1.0.1] - 2026-02-05 - Custom Server Build

### Changed
- Updated server endpoint to 10.10.10.123:18789
- Modified host permissions for new server address
- Created Mac-specific installation package
- Added installation documentation

### Added
- INSTALL-MAC.md with detailed setup instructions
- Custom build identifier in manifest
- Pre-configured server settings

## [1.0.0] - 2026-02-05 - Initial Release

### Added
- Basic bookmark management (list, search, add, delete, move, duplicates)
- Tab management (list, create, close, focus, group by domain)
- WebSocket communication with Skynet/Clawdbot gateway
- LCARS-styled popup interface
- Real-time connection status and health monitoring
- Background service worker with auto-reconnect
- Chrome debugger integration foundation
- Basic extension permissions and security model

### Features
- **Bookmark Operations**: Complete CRUD operations for bookmarks
- **Tab Control**: Comprehensive tab management capabilities
- **WebSocket Protocol**: Bi-directional communication with gateway
- **Visual Design**: Star Trek LCARS-inspired interface
- **Connection Management**: Auto-reconnect with exponential backoff
- **Error Handling**: Robust error reporting and recovery

---

### Version Format
Versions follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards compatible)  
- **PATCH**: Bug fixes (backwards compatible)

### Links
- **Repository**: https://github.com/WispAyr/skynet-browser-extension-custom
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: See README.md for detailed usage instructions