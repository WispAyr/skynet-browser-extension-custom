// Enhanced Skynet Browser Manager - Popup Interface
// Handles UI interactions for advanced features

class SkynetPopup {
  constructor() {
    this.currentTab = 'dashboard';
    this.connectionState = 'disconnected';
    this.stats = {
      autoBookmarks: 0,
      sharedTabs: 0,
      debugSessions: 0
    };
    
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    this.setupTabNavigation();
    this.updateConnectionStatus();
    this.loadInitialData();
    this.startConnectionTimer();
    
    // Listen for background script messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleBackgroundMessage(message, sender, sendResponse);
    });
  }
  
  setupEventListeners() {
    // Dashboard actions
    document.getElementById('enableAutoBookmark').addEventListener('click', () => {
      this.toggleAutoBookmarking();
    });
    
    document.getElementById('createSharedTab').addEventListener('click', () => {
      this.shareCurrentTab();
    });
    
    document.getElementById('enableDebug').addEventListener('click', () => {
      this.enableDebugging();
    });
    
    document.getElementById('exportBookmarks').addEventListener('click', () => {
      this.exportData();
    });
    
    // Bookmark actions
    document.getElementById('bookmarkSearch').addEventListener('input', (e) => {
      this.searchBookmarks(e.target.value);
    });
    
    document.getElementById('findDuplicates').addEventListener('click', () => {
      this.findDuplicateBookmarks();
    });
    
    document.getElementById('sortBookmarks').addEventListener('click', () => {
      this.sortBookmarks();
    });
    
    document.getElementById('cleanupBookmarks').addEventListener('click', () => {
      this.cleanupBookmarks();
    });
    
    // Tab actions
    document.getElementById('groupByDomain').addEventListener('click', () => {
      this.groupTabsByDomain();
    });
    
    document.getElementById('closeInactive').addEventListener('click', () => {
      this.closeInactiveTabs();
    });
    
    document.getElementById('duplicateTabs').addEventListener('click', () => {
      this.findDuplicateTabs();
    });
    
    // Collaboration actions
    document.getElementById('shareCurrentTab').addEventListener('click', () => {
      this.shareCurrentTabWithName();
    });
    
    // Collaboration tools
    ['syncScroll', 'shareClicks', 'voiceChat', 'screenShare'].forEach(toolId => {
      document.getElementById(toolId).addEventListener('click', () => {
        this.toggleCollaborationTool(toolId);
      });
    });
    
    // Debug actions
    document.getElementById('startDebugging').addEventListener('click', () => {
      this.startDebugSession();
    });
    
    document.getElementById('executeCommand').addEventListener('click', () => {
      this.executeDebugCommand();
    });
    
    document.getElementById('consoleInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.executeDebugCommand();
      }
    });
  }
  
  setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        this.currentTab = targetTab;
        this.loadTabContent(targetTab);
      });
    });
  }
  
  async loadTabContent(tabName) {
    switch (tabName) {
      case 'bookmarks':
        await this.loadBookmarks();
        break;
      case 'tabs':
        await this.loadTabs();
        break;
      case 'collaboration':
        await this.loadSharedSessions();
        break;
      case 'debug':
        await this.loadDebugSessions();
        break;
    }
  }
  
  // ============================================
  // Auto-Bookmarking Features
  // ============================================
  
  async toggleAutoBookmarking() {
    try {
      const currentStatus = await this.sendToBackground({
        action: 'auto-bookmark.status'
      });
      
      const newAction = currentStatus.enabled ? 'auto-bookmark.disable' : 'auto-bookmark.enable';
      const result = await this.sendToBackground({ action: newAction });
      
      const statusBadge = document.getElementById('autoBookmarkStatus');
      const btn = document.getElementById('enableAutoBookmark');
      
      if (result.data.enabled) {
        statusBadge.textContent = 'ON';
        statusBadge.classList.add('on');
        btn.style.background = 'linear-gradient(45deg, #004488, #00aa44)';
      } else {
        statusBadge.textContent = 'OFF';
        statusBadge.classList.remove('on');
        btn.style.background = 'linear-gradient(45deg, #003366, #004488)';
      }
      
      this.showNotification(result.data.enabled ? 'Auto-bookmarking enabled!' : 'Auto-bookmarking disabled');
    } catch (err) {
      this.showError('Failed to toggle auto-bookmarking: ' + err.message);
    }
  }
  
  // ============================================
  // Shared Tabs & Collaboration
  // ============================================
  
  async shareCurrentTab() {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const result = await this.sendToBackground({
        action: 'shared.tab.create',
        url: currentTab.url,
        sessionName: `Shared: ${currentTab.title.slice(0, 30)}`
      });
      
      this.stats.sharedTabs++;
      this.updateStats();
      
      this.showNotification(`Shared tab created: ${result.data.sessionId.slice(0, 8)}`);
      
      if (this.currentTab === 'collaboration') {
        await this.loadSharedSessions();
      }
    } catch (err) {
      this.showError('Failed to share tab: ' + err.message);
    }
  }
  
  async shareCurrentTabWithName() {
    const sessionName = document.getElementById('sessionNameInput').value.trim();
    
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const result = await this.sendToBackground({
        action: 'shared.tab.create',
        url: currentTab.url,
        sessionName: sessionName || `Shared: ${currentTab.title.slice(0, 30)}`
      });
      
      this.stats.sharedTabs++;
      this.updateStats();
      
      document.getElementById('sessionNameInput').value = '';
      this.showNotification(`Shared session created: ${result.data.sessionName}`);
      
      await this.loadSharedSessions();
    } catch (err) {
      this.showError('Failed to create shared session: ' + err.message);
    }
  }
  
  async loadSharedSessions() {
    try {
      const result = await this.sendToBackground({
        action: 'shared.sessions.list'
      });
      
      const container = document.getElementById('sharedSessionsList');
      
      if (!result.data || result.data.length === 0) {
        container.innerHTML = '<div class="empty-state">No active shared sessions</div>';
        return;
      }
      
      container.innerHTML = result.data.map(session => `
        <div class="session-item slide-in">
          <div class="session-info">
            <div class="session-name">${session.sessionName}</div>
            <div class="session-details">
              ${session.participants.length} participants • 
              Active: ${this.formatTime(Date.now() - session.lastActivity)}
            </div>
          </div>
          <div class="session-actions">
            <button class="session-btn" onclick="skynetPopup.joinSession('${session.sessionId}')">Join</button>
            <button class="session-btn" onclick="skynetPopup.endSession('${session.sessionId}')">End</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load shared sessions:', err);
    }
  }
  
  async joinSession(sessionId) {
    try {
      await this.sendToBackground({
        action: 'shared.tab.join',
        sessionId: sessionId
      });
      
      this.showNotification('Joined shared session!');
    } catch (err) {
      this.showError('Failed to join session: ' + err.message);
    }
  }
  
  async endSession(sessionId) {
    try {
      await this.sendToBackground({
        action: 'shared.tab.end',
        sessionId: sessionId
      });
      
      this.showNotification('Session ended');
      await this.loadSharedSessions();
    } catch (err) {
      this.showError('Failed to end session: ' + err.message);
    }
  }
  
  toggleCollaborationTool(toolId) {
    const btn = document.getElementById(toolId);
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
      btn.classList.remove('active');
      this.showNotification(`${toolId} disabled`);
    } else {
      btn.classList.add('active');
      this.showNotification(`${toolId} enabled`);
    }
    
    // Send to background script
    this.sendToBackground({
      action: 'collaboration.tool.toggle',
      tool: toolId,
      enabled: !isActive
    });
  }
  
  // ============================================
  // Remote Debugging
  // ============================================
  
  async enableDebugging() {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const options = {
        console: document.getElementById('debugConsole').checked,
        network: document.getElementById('debugNetwork').checked,
        runtime: document.getElementById('debugRuntime').checked,
        dom: document.getElementById('debugDOM').checked,
        performance: document.getElementById('debugPerf').checked
      };
      
      const result = await this.sendToBackground({
        action: 'debug.enable',
        tabId: currentTab.id,
        options: options
      });
      
      this.stats.debugSessions++;
      this.updateStats();
      
      this.showNotification(`Debug session started: ${result.data.sessionId.slice(0, 8)}`);
      
      if (this.currentTab === 'debug') {
        await this.loadDebugSessions();
      }
    } catch (err) {
      this.showError('Failed to enable debugging: ' + err.message);
    }
  }
  
  async startDebugSession() {
    await this.enableDebugging();
  }
  
  async executeDebugCommand() {
    const input = document.getElementById('consoleInput');
    const command = input.value.trim();
    
    if (!command) return;
    
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const result = await this.sendToBackground({
        action: 'debug.execute',
        tabId: currentTab.id,
        command: command
      });
      
      this.addToDebugConsole(`> ${command}`);
      this.addToDebugConsole(`< ${JSON.stringify(result.data, null, 2)}`, 'info');
      
      input.value = '';
    } catch (err) {
      this.addToDebugConsole(`> ${command}`);
      this.addToDebugConsole(`! ${err.message}`, 'error');
      input.value = '';
    }
  }
  
  addToDebugConsole(message, type = '') {
    const console = document.getElementById('debugConsole');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
  }
  
  async loadDebugSessions() {
    try {
      const result = await this.sendToBackground({
        action: 'debug.sessions.list'
      });
      
      const container = document.getElementById('debugSessionsList');
      
      if (!result.data || result.data.length === 0) {
        container.innerHTML = '<div class="empty-state">No active debug sessions</div>';
        return;
      }
      
      container.innerHTML = result.data.map(session => `
        <div class="session-item slide-in">
          <div class="session-info">
            <div class="session-name">Debug: ${session.sessionId.slice(0, 8)}</div>
            <div class="session-details">
              Tab ${session.tabId} • 
              ${Object.keys(session.features).filter(k => session.features[k]).join(', ')}
            </div>
          </div>
          <div class="session-actions">
            <button class="session-btn" onclick="skynetPopup.attachToDebugSession('${session.sessionId}')">Attach</button>
            <button class="session-btn" onclick="skynetPopup.stopDebugSession('${session.sessionId}')">Stop</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load debug sessions:', err);
    }
  }
  
  // ============================================
  // Bookmark & Tab Management
  // ============================================
  
  async loadBookmarks() {
    try {
      const result = await this.sendToBackground({
        action: 'bookmarks.list'
      });
      
      this.renderBookmarks(result.data[0].children || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  }
  
  renderBookmarks(bookmarks) {
    const container = document.getElementById('bookmarkList');
    container.innerHTML = this.renderBookmarkTree(bookmarks).join('');
  }
  
  renderBookmarkTree(nodes, depth = 0) {
    const items = [];
    
    for (const node of nodes) {
      if (node.url) {
        // It's a bookmark
        items.push(`
          <div class="list-item" style="margin-left: ${depth * 15}px;">
            <div class="list-item-icon">🔖</div>
            <div class="list-item-text">
              <div>${node.title}</div>
              <div class="list-item-url">${node.url}</div>
            </div>
          </div>
        `);
      } else if (node.children) {
        // It's a folder
        items.push(`
          <div class="list-item" style="margin-left: ${depth * 15}px;">
            <div class="list-item-icon">📁</div>
            <div class="list-item-text">${node.title}</div>
          </div>
        `);
        
        items.push(...this.renderBookmarkTree(node.children, depth + 1));
      }
    }
    
    return items;
  }
  
  async loadTabs() {
    try {
      const result = await this.sendToBackground({
        action: 'tabs.list'
      });
      
      const container = document.getElementById('tabList');
      container.innerHTML = result.data.map(tab => `
        <div class="list-item" onclick="skynetPopup.focusTab(${tab.id})">
          <div class="list-item-icon">${tab.favIconUrl ? `<img src="${tab.favIconUrl}" width="16" height="16">` : '🌐'}</div>
          <div class="list-item-text">
            <div>${tab.title}</div>
            <div class="list-item-url">${tab.url}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load tabs:', err);
    }
  }
  
  async focusTab(tabId) {
    try {
      await chrome.tabs.update(tabId, { active: true });
      window.close();
    } catch (err) {
      this.showError('Failed to focus tab');
    }
  }
  
  // ============================================
  // Utility Functions
  // ============================================
  
  async sendToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success === false) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  handleBackgroundMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'state-update':
        this.connectionState = message.state;
        this.updateConnectionStatus();
        break;
        
      case 'auto.bookmark.created':
        this.stats.autoBookmarks++;
        this.updateStats();
        this.showNotification(`Auto-bookmarked: ${message.tab.title.slice(0, 30)}`);
        break;
        
      case 'debug.log':
        if (this.currentTab === 'debug') {
          this.addToDebugConsole(`[${message.sessionId.slice(0, 8)}] ${message.message}`, 'info');
        }
        break;
    }
  }
  
  updateConnectionStatus() {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    indicator.className = `status-indicator ${this.connectionState}`;
    text.textContent = this.connectionState.toUpperCase();
  }
  
  updateStats() {
    document.getElementById('autoBookmarksCount').textContent = this.stats.autoBookmarks;
    document.getElementById('sharedTabsCount').textContent = this.stats.sharedTabs;
    document.getElementById('debugSessionsCount').textContent = this.stats.debugSessions;
  }
  
  showNotification(message) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 15px;
      background: linear-gradient(45deg, #00d4ff, #0099cc);
      color: black;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 10px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 15px;
      background: linear-gradient(45deg, #ff3333, #cc0000);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 10px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
  
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  startConnectionTimer() {
    let startTime = Date.now();
    
    setInterval(() => {
      if (this.connectionState === 'connected') {
        const elapsed = Date.now() - startTime;
        document.getElementById('connectionTime').textContent = this.formatTime(elapsed);
      } else {
        startTime = Date.now();
        document.getElementById('connectionTime').textContent = '00:00:00';
      }
    }, 1000);
  }
  
  async loadInitialData() {
    try {
      // Load initial stats or any other startup data
      this.updateStats();
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }
  
  // Additional methods for bookmark and tab management
  async searchBookmarks(query) {
    if (!query.trim()) {
      await this.loadBookmarks();
      return;
    }
    
    try {
      const result = await this.sendToBackground({
        action: 'bookmarks.search',
        query: query
      });
      
      const container = document.getElementById('bookmarkList');
      container.innerHTML = result.data.map(bookmark => `
        <div class="list-item">
          <div class="list-item-icon">🔖</div>
          <div class="list-item-text">
            <div>${bookmark.title}</div>
            <div class="list-item-url">${bookmark.url}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Search failed:', err);
    }
  }
  
  async findDuplicateBookmarks() {
    this.showNotification('Finding duplicate bookmarks...');
    // Implementation for finding duplicates
  }
  
  async sortBookmarks() {
    this.showNotification('Sorting bookmarks alphabetically...');
    // Implementation for sorting
  }
  
  async cleanupBookmarks() {
    this.showNotification('Cleaning up bookmarks...');
    // Implementation for cleanup
  }
  
  async groupTabsByDomain() {
    this.showNotification('Grouping tabs by domain...');
    // Implementation for grouping
  }
  
  async closeInactiveTabs() {
    this.showNotification('Closing inactive tabs...');
    // Implementation for closing inactive tabs
  }
  
  async findDuplicateTabs() {
    this.showNotification('Finding duplicate tabs...');
    // Implementation for finding duplicate tabs
  }
  
  async exportData() {
    this.showNotification('Exporting data...');
    // Implementation for data export
  }
}

// Initialize the popup interface
const skynetPopup = new SkynetPopup();