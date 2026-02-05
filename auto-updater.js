// Skynet Browser Extension - Auto-Updater System
// Handles automatic updates from GitHub releases

class SkynetAutoUpdater {
  constructor() {
    this.currentVersion = chrome.runtime.getManifest().version;
    this.updateCheckInterval = 30 * 60 * 1000; // 30 minutes
    this.githubRepo = 'WispAyr/skynet-browser-extension-custom';
    this.updateCheckTimer = null;
    this.isUpdating = false;
    this.updateHistory = [];
    
    this.init();
  }
  
  async init() {
    // Load update settings and history
    await this.loadSettings();
    await this.loadUpdateHistory();
    
    // Start automatic update checking
    if (this.settings.autoCheck) {
      this.startUpdateChecking();
    }
    
    // Check for updates on startup (with delay)
    setTimeout(() => {
      this.checkForUpdates(false); // Silent check
    }, 10000);
    
    console.log('[Skynet Updater] Initialized - Current version:', this.currentVersion);
  }
  
  async loadSettings() {
    const result = await chrome.storage.local.get(['skynetUpdateSettings']);
    this.settings = result.skynetUpdateSettings || {
      autoCheck: true,
      autoDownload: false,
      autoInstall: false,
      checkInterval: 30, // minutes
      notifyUpdates: true,
      includePrereleases: false,
      backupBeforeUpdate: true
    };
  }
  
  async saveSettings() {
    await chrome.storage.local.set({ skynetUpdateSettings: this.settings });
  }
  
  async loadUpdateHistory() {
    const result = await chrome.storage.local.get(['skynetUpdateHistory']);
    this.updateHistory = result.skynetUpdateHistory || [];
  }
  
  async saveUpdateHistory() {
    await chrome.storage.local.set({ skynetUpdateHistory: this.updateHistory });
  }
  
  startUpdateChecking() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }
    
    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates(false); // Silent background check
    }, this.settings.checkInterval * 60 * 1000);
    
    console.log('[Skynet Updater] Auto-check enabled, interval:', this.settings.checkInterval, 'minutes');
  }
  
  stopUpdateChecking() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
  }
  
  async checkForUpdates(showProgress = true) {
    if (this.isUpdating) {
      console.log('[Skynet Updater] Update already in progress');
      return;
    }
    
    try {
      if (showProgress) {
        this.notifyStatus('Checking for updates...', 'info');
      }
      
      // Fetch latest release from GitHub API
      const response = await fetch(`https://api.github.com/repos/${this.githubRepo}/releases/latest`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const release = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix
      
      console.log('[Skynet Updater] Current:', this.currentVersion, 'Latest:', latestVersion);
      
      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        console.log('[Skynet Updater] Update available:', latestVersion);
        
        const updateInfo = {
          version: latestVersion,
          releaseDate: new Date(release.published_at),
          downloadUrl: this.getDownloadUrl(release),
          releaseNotes: release.body,
          releaseTitle: release.name,
          isPrerelease: release.prerelease,
          size: this.getAssetSize(release)
        };
        
        if (this.settings.notifyUpdates) {
          this.notifyUpdateAvailable(updateInfo);
        }
        
        // Auto-download if enabled
        if (this.settings.autoDownload) {
          await this.downloadUpdate(updateInfo);
        }
        
        return updateInfo;
      } else {
        if (showProgress) {
          this.notifyStatus('Extension is up to date!', 'success');
        }
        return null;
      }
    } catch (err) {
      console.error('[Skynet Updater] Check failed:', err);
      if (showProgress) {
        this.notifyStatus(`Update check failed: ${err.message}`, 'error');
      }
      throw err;
    }
  }
  
  async downloadUpdate(updateInfo) {
    if (!updateInfo.downloadUrl) {
      throw new Error('No download URL available');
    }
    
    this.isUpdating = true;
    this.notifyStatus(`Downloading update ${updateInfo.version}...`, 'info');
    
    try {
      // Create backup before updating
      if (this.settings.backupBeforeUpdate) {
        await this.createBackup();
      }
      
      // Download the update zip file
      const response = await fetch(updateInfo.downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Store the downloaded update
      await this.storeUpdate(updateInfo, blob);
      
      this.notifyStatus(`Update ${updateInfo.version} downloaded successfully!`, 'success');
      
      // Auto-install if enabled
      if (this.settings.autoInstall) {
        await this.installUpdate(updateInfo);
      } else {
        this.notifyInstallReady(updateInfo);
      }
      
    } catch (err) {
      console.error('[Skynet Updater] Download failed:', err);
      this.notifyStatus(`Download failed: ${err.message}`, 'error');
      throw err;
    } finally {
      this.isUpdating = false;
    }
  }
  
  async installUpdate(updateInfo) {
    try {
      this.notifyStatus(`Installing update ${updateInfo.version}...`, 'info');
      
      // For unpacked extensions, we need to guide the user through manual installation
      // since we can't automatically replace the extension files
      this.showInstallInstructions(updateInfo);
      
      // Record the update attempt
      this.updateHistory.unshift({
        version: updateInfo.version,
        date: new Date(),
        status: 'download_ready',
        previousVersion: this.currentVersion
      });
      
      await this.saveUpdateHistory();
      
    } catch (err) {
      console.error('[Skynet Updater] Install failed:', err);
      this.notifyStatus(`Install failed: ${err.message}`, 'error');
      throw err;
    }
  }
  
  async createBackup() {
    try {
      const backupData = {
        version: this.currentVersion,
        timestamp: Date.now(),
        settings: await chrome.storage.local.get(),
        manifest: chrome.runtime.getManifest()
      };
      
      await chrome.storage.local.set({
        [`skynet_backup_${this.currentVersion}`]: backupData
      });
      
      console.log('[Skynet Updater] Backup created for version:', this.currentVersion);
    } catch (err) {
      console.error('[Skynet Updater] Backup failed:', err);
    }
  }
  
  async storeUpdate(updateInfo, blob) {
    // Convert blob to base64 for storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          await chrome.storage.local.set({
            skynet_pending_update: {
              ...updateInfo,
              data: base64Data,
              downloadDate: new Date()
            }
          });
          
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  async getPendingUpdate() {
    const result = await chrome.storage.local.get(['skynet_pending_update']);
    return result.skynet_pending_update;
  }
  
  async clearPendingUpdate() {
    await chrome.storage.local.remove(['skynet_pending_update']);
  }
  
  showInstallInstructions(updateInfo) {
    // Send message to popup to show install instructions
    chrome.runtime.sendMessage({
      type: 'update.install.instructions',
      updateInfo: updateInfo
    });
    
    // Also show browser notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Skynet Extension Update Ready',
      message: `Version ${updateInfo.version} is ready to install. Click the extension for instructions.`
    });
  }
  
  notifyUpdateAvailable(updateInfo) {
    // Send to popup
    chrome.runtime.sendMessage({
      type: 'update.available',
      updateInfo: updateInfo
    });
    
    // Browser notification
    if (this.settings.notifyUpdates) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Skynet Extension Update Available',
        message: `Version ${updateInfo.version} is available. ${this.settings.autoDownload ? 'Downloading...' : 'Click to download.'}`
      });
    }
  }
  
  notifyInstallReady(updateInfo) {
    chrome.runtime.sendMessage({
      type: 'update.ready',
      updateInfo: updateInfo
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Skynet Extension Update Downloaded',
      message: `Version ${updateInfo.version} is ready to install. Click the extension to continue.`
    });
  }
  
  notifyStatus(message, type = 'info') {
    chrome.runtime.sendMessage({
      type: 'update.status',
      message: message,
      statusType: type
    });
  }
  
  isNewerVersion(newVersion, currentVersion) {
    const parseVersion = (v) => v.split('.').map(n => parseInt(n, 10));
    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);
    
    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }
    
    return false;
  }
  
  getDownloadUrl(release) {
    // Look for the main zip asset
    const asset = release.assets.find(asset => 
      asset.name.includes('enhanced') || 
      asset.name.includes('.zip')
    );
    
    return asset ? asset.browser_download_url : null;
  }
  
  getAssetSize(release) {
    const asset = release.assets.find(asset => 
      asset.name.includes('enhanced') || 
      asset.name.includes('.zip')
    );
    
    return asset ? Math.round(asset.size / 1024) + ' KB' : 'Unknown';
  }
  
  // Public API methods
  async manualUpdateCheck() {
    return await this.checkForUpdates(true);
  }
  
  async downloadAvailableUpdate() {
    const updateInfo = await this.checkForUpdates(false);
    if (updateInfo) {
      await this.downloadUpdate(updateInfo);
    } else {
      throw new Error('No updates available');
    }
  }
  
  async getUpdateSettings() {
    return { ...this.settings };
  }
  
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // Restart update checking with new interval
    if (this.settings.autoCheck) {
      this.startUpdateChecking();
    } else {
      this.stopUpdateChecking();
    }
  }
  
  async getUpdateHistory() {
    return [...this.updateHistory];
  }
  
  async rollbackUpdate(targetVersion) {
    try {
      const backupKey = `skynet_backup_${targetVersion}`;
      const result = await chrome.storage.local.get([backupKey]);
      
      if (!result[backupKey]) {
        throw new Error(`No backup found for version ${targetVersion}`);
      }
      
      // For unpacked extensions, guide user through rollback
      this.showRollbackInstructions(targetVersion, result[backupKey]);
      
    } catch (err) {
      console.error('[Skynet Updater] Rollback failed:', err);
      throw err;
    }
  }
  
  showRollbackInstructions(version, backupData) {
    chrome.runtime.sendMessage({
      type: 'update.rollback.instructions',
      version: version,
      backupData: backupData
    });
  }
  
  // Generate download link for pending update
  async generateUpdateDownloadLink() {
    const pendingUpdate = await this.getPendingUpdate();
    if (!pendingUpdate) {
      throw new Error('No pending update found');
    }
    
    // Convert base64 back to blob
    const binaryString = atob(pendingUpdate.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    
    return {
      url: url,
      filename: `skynet-extension-${pendingUpdate.version}.zip`,
      version: pendingUpdate.version
    };
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkynetAutoUpdater;
}