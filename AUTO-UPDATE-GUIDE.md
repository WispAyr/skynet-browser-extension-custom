# Skynet Extension Auto-Update System

## 🚀 Overview

The Skynet Browser Extension now includes a sophisticated auto-update system that can automatically check for, download, and help install updates from GitHub releases.

## ✨ Features

### 🔍 **Automatic Update Checking**
- Checks GitHub releases every 30 minutes (configurable)
- Compares semantic versions to detect newer releases
- Silent background checks with optional notifications
- Manual update checking via the Updates tab

### ⬇️ **Smart Download Management**
- Automatic download of update packages
- Progress tracking with visual indicators
- Local storage of update files
- Download link generation for manual installation

### 🛠️ **Installation Assistance**
- Step-by-step installation instructions
- Automatic backup creation before updates
- Version verification and rollback support
- Install-ready notifications

### ⚙️ **Configurable Settings**
- Auto-check intervals (15 minutes to daily)
- Auto-download toggle
- Update notifications control
- Backup preferences

## 🎛️ How to Use

### **Accessing the Update System**
1. Click the Skynet extension icon
2. Navigate to the **Updates** tab
3. The system shows current version status and available updates

### **Manual Update Check**
- Click **"Check Now"** in the Updates tab
- System will check GitHub for newer releases
- Results appear immediately with download options

### **Configuring Auto-Updates**
1. Click **"Settings"** in the Updates tab
2. Toggle desired options:
   - **Auto-check**: Automatic background checking
   - **Auto-download**: Download updates when found
   - **Notifications**: Browser notifications for updates
   - **Backup**: Create backups before updating
3. Set check interval (15 min - 24 hours)
4. Click **"Save Settings"**

### **Installing Updates**

#### **Automatic Process (Recommended)**
1. When update is available, click **"Download Update"**
2. System downloads and prepares the update
3. Click **"Install Now"** when ready
4. Follow the guided installation instructions

#### **Manual Process**
1. Click **"Download File"** to save the update zip
2. Extract the zip to a new folder
3. Go to `chrome://extensions/`
4. Remove the old Skynet extension
5. Click "Load unpacked" and select the new folder
6. Verify the new version number

## 📊 Update Status Indicators

### **Status Icons**
- ✅ **Up to Date**: Latest version installed
- 🔍 **Checking**: Currently checking for updates  
- 🎉 **Available**: New update found and ready to download
- 📦 **Ready**: Update downloaded and ready to install
- ❌ **Error**: Update check or download failed

### **Update Badge**
- **Orange badge (!)** appears on the Updates tab when updates are available
- Badge pulses to draw attention
- Disappears when updates are installed

## 🔧 Technical Details

### **Update Sources**
- **Primary**: GitHub Releases API (`WispAyr/skynet-browser-extension-custom`)
- **Assets**: Looks for `.zip` files or files containing "enhanced"
- **Versions**: Uses semantic versioning (e.g., 2.0.0, 2.1.0, 2.0.1)

### **Storage Locations**
- **Settings**: `chrome.storage.local.skynetUpdateSettings`
- **History**: `chrome.storage.local.skynetUpdateHistory`  
- **Pending Updates**: `chrome.storage.local.skynet_pending_update`
- **Backups**: `chrome.storage.local.skynet_backup_[version]`

### **Update Workflow**
```
Check GitHub API → Compare Versions → Download ZIP → Store Locally → Show Install Instructions
```

### **Backup System**
- Creates automatic backups before major updates
- Stores extension settings, manifest, and metadata
- Enables rollback to previous versions
- Backup retention based on storage limits

## 🛡️ Security & Privacy

### **What Auto-Updater Accesses**
- **GitHub API**: Public release information only
- **Download URLs**: Official release assets
- **Local Storage**: Extension settings and update data
- **Notifications**: System-level update alerts

### **What It Doesn't Access**
- **Private Data**: No access to browsing history or personal data
- **Other Extensions**: Cannot modify other browser extensions
- **System Files**: No file system access outside extension storage
- **Network**: Only connects to official GitHub API endpoints

### **Security Measures**
- **HTTPS Only**: All API calls and downloads use HTTPS
- **Version Verification**: Validates version format and source
- **Storage Encryption**: Uses Chrome's built-in storage security
- **Limited Permissions**: Minimal required permissions only

## 📋 Update Settings Reference

### **Auto-Check Settings**
- **Enabled**: `autoCheck: true/false`
- **Interval**: `checkInterval: 15-1440` (minutes)
- **Default**: Every 30 minutes

### **Download Settings**
- **Auto-Download**: `autoDownload: true/false`
- **Auto-Install**: `autoInstall: false` (always manual for security)
- **Default**: Manual download required

### **Notification Settings**
- **Browser Notifications**: `notifyUpdates: true/false`
- **Update Badge**: Always shown when updates available
- **Default**: Notifications enabled

### **Backup Settings**
- **Create Backups**: `backupBeforeUpdate: true/false`
- **Retention**: Automatic cleanup of old backups
- **Default**: Backups enabled

## 🚨 Troubleshooting

### **Common Issues**

#### **"Update Check Failed"**
- **Cause**: Network connectivity or GitHub API issues
- **Solution**: Check internet connection, try again later
- **Manual Fix**: Use manual download from GitHub releases

#### **"Download Failed"**
- **Cause**: Large file size, slow connection, or storage limits
- **Solution**: Free up storage space, try stable connection
- **Alternative**: Download manually from GitHub

#### **"No Updates Found" (But You Know There Are)**
- **Cause**: Version comparison logic or cached results
- **Solution**: Clear extension storage, restart browser
- **Debug**: Check console logs for version comparison details

#### **Installation Instructions Not Showing**
- **Cause**: Popup blocked or extension permissions
- **Solution**: Allow notifications, check popup blocker
- **Alternative**: Follow manual installation steps

### **Debug Information**

#### **Console Logs**
- Open `chrome://extensions/`
- Click "Inspect views: service worker" on Skynet extension
- Check console for `[Skynet Updater]` messages

#### **Storage Inspection**
- Navigate to `chrome://extensions/`
- Click "Inspect views: service worker"
- Go to Application tab → Storage → chrome.storage
- Look for `skynetUpdateSettings`, `skynetUpdateHistory`

#### **Network Issues**
- Check if `api.github.com` is accessible
- Verify corporate firewall allows GitHub API calls
- Test with manual browser visit to GitHub releases page

## 🔄 Version History Tracking

### **Update History Display**
- Shows all previous update attempts
- Displays version numbers, dates, and status
- Tracks successful, failed, and pending updates
- Helps diagnose recurring update issues

### **History Cleanup**
- Automatically removes old history entries (>50 items)
- Retains recent updates for troubleshooting
- Manual cleanup via extension storage reset

## 📱 Future Enhancements

### **Planned Features**
- **Staged Rollouts**: Gradual release to subset of users
- **Delta Updates**: Only download changed files
- **Auto-Restart**: Automatic extension restart after update
- **Team Notifications**: Alert administrators of team updates
- **Custom Channels**: Beta, stable, enterprise release tracks

### **Integration Improvements**
- **Background Sync**: Update even when browser closed
- **Cross-Device**: Sync update preferences across devices
- **Enterprise Management**: Centralized update control
- **Analytics**: Update success/failure reporting

## 📞 Support

### **Getting Help**
1. **Check Console**: Look for `[Skynet Updater]` logs
2. **Review Settings**: Verify auto-update configuration
3. **Test Manually**: Try manual update check
4. **Clear Storage**: Reset extension storage if needed

### **Reporting Issues**
- **Include Version**: Current extension version
- **Describe Steps**: What you tried to do
- **Error Messages**: Any console errors or notifications
- **Network Info**: Connection type, corporate firewall, etc.

---

**Auto-Update System v2.0.0**  
**Integrated**: February 5, 2026  
**Compatible**: Chrome/Chromium Extensions Manifest v3