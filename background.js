// Skynet Browser Manager - Enhanced Background Service Worker
// WebSocket connection to Clawdbot gateway + advanced features

const GATEWAY_URL = 'ws://10.10.10.123:18789/extension';
const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 30000;
const AUTO_BOOKMARK_DELAY = 3000; // Wait 3 seconds before auto-bookmarking

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let connectionState = 'disconnected';
let autoBookmarkTimer = null;
let sharedTabs = new Map(); // tabId -> shared session data
let debugSessions = new Map(); // tabId -> debug session data
let autoUpdater = null; // Auto-updater instance

// ============================================
// Auto-Updater Integration
// ============================================

// Initialize auto-updater with fallback
async function initializeAutoUpdater() {
  try {
    // For now, create a simple placeholder until auto-updater is fully integrated
    autoUpdater = {
      manualUpdateCheck: async () => { 
        // Check GitHub API for updates
        try {
          const response = await fetch('https://api.github.com/repos/WispAyr/skynet-browser-extension-custom/releases/latest');
          const release = await response.json();
          const latestVersion = release.tag_name.replace(/^v/, '');
          const currentVersion = chrome.runtime.getManifest().version;
          
          if (latestVersion !== currentVersion) {
            return {
              version: latestVersion,
              releaseDate: new Date(release.published_at),
              downloadUrl: release.assets.find(a => a.name.includes('.zip'))?.browser_download_url,
              releaseNotes: release.body,
              releaseTitle: release.name
            };
          }
          return null;
        } catch (err) {
          throw new Error('Update check failed');
        }
      },
      downloadAvailableUpdate: async () => { 
        return { status: 'Manual download required' };
      },
      getUpdateSettings: async () => ({ 
        autoCheck: true,
        autoDownload: false,
        notifyUpdates: true,
        checkInterval: 30,
        backupBeforeUpdate: true
      }),
      updateSettings: async (settings) => {
        await chrome.storage.local.set({ skynetUpdateSettings: settings });
      },
      getUpdateHistory: async () => [],
      rollbackUpdate: async () => { 
        throw new Error('Rollback not available'); 
      },
      generateUpdateDownloadLink: async () => {
        const response = await fetch('https://api.github.com/repos/WispAyr/skynet-browser-extension-custom/releases/latest');
        const release = await response.json();
        const asset = release.assets.find(a => a.name.includes('.zip'));
        return {
          url: asset?.browser_download_url,
          filename: asset?.name,
          version: release.tag_name.replace(/^v/, '')
        };
      }
    };
    console.log('[Skynet] Auto-updater initialized (simplified)');
  } catch (err) {
    console.error('[Skynet] Auto-updater initialization failed:', err);
  }
}

// ============================================
// Auto-Bookmarking System
// ============================================

// Keywords that indicate "work" content
const WORK_KEYWORDS = [
  'github', 'gitlab', 'bitbucket', 'stackoverflow', 'docs', 'documentation',
  'api', 'tutorial', 'guide', 'reference', 'manual', 'wiki', 'confluence',
  'jira', 'trello', 'notion', 'figma', 'miro', 'slack', 'discord',
  'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform',
  'react', 'vue', 'angular', 'nodejs', 'python', 'javascript',
  'development', 'programming', 'coding', 'software', 'engineering'
];

// Domains that are typically work-related
const WORK_DOMAINS = [
  'github.com', 'gitlab.com', 'stackoverflow.com', 'docs.google.com',
  'confluence.atlassian.com', 'jira.atlassian.com', 'figma.com',
  'notion.so', 'miro.com', 'slack.com', 'discord.com',
  'aws.amazon.com', 'console.aws.amazon.com', 'azure.microsoft.com',
  'console.cloud.google.com', 'kubernetes.io', 'docker.com'
];

// Auto-bookmark intelligent detection
async function analyzeAndBookmarkTab(tabId, tab) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  try {
    const url = new URL(tab.url);
    const domain = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const title = tab.title?.toLowerCase() || '';
    
    // Check if this looks like work content
    const isWorkDomain = WORK_DOMAINS.some(workDomain => domain.includes(workDomain));
    const hasWorkKeywords = WORK_KEYWORDS.some(keyword => 
      title.includes(keyword) || path.includes(keyword) || domain.includes(keyword)
    );
    
    // Additional heuristics
    const hasLongSession = await checkSessionDuration(tabId) > 60000; // 1+ minutes
    const hasInteraction = await checkTabInteraction(tabId);
    
    if (isWorkDomain || hasWorkKeywords || (hasLongSession && hasInteraction)) {
      await autoBookmarkTab(tab);
    }
  } catch (err) {
    console.error('[Skynet] Auto-bookmark analysis failed:', err);
  }
}

async function autoBookmarkTab(tab) {
  try {
    // Check if already bookmarked
    const existingBookmarks = await chrome.bookmarks.search({ url: tab.url });
    if (existingBookmarks.length > 0) {
      return; // Already bookmarked
    }
    
    // Create auto-bookmark folder if it doesn't exist
    let autoFolder = await findOrCreateFolder('🤖 Auto-Bookmarked');
    
    // Create date-based subfolder
    const today = new Date().toISOString().split('T')[0];
    const dateFolder = await findOrCreateFolder(today, autoFolder.id);
    
    // Create bookmark with enriched title
    const enrichedTitle = `${tab.title} [Auto-${new Date().toLocaleTimeString()}]`;
    
    const bookmark = await chrome.bookmarks.create({
      parentId: dateFolder.id,
      title: enrichedTitle,
      url: tab.url
    });
    
    // Notify gateway about auto-bookmark
    send({
      type: 'auto.bookmark.created',
      bookmark: bookmark,
      tab: { id: tab.id, title: tab.title, url: tab.url },
      reason: 'auto-detection',
      timestamp: Date.now()
    });
    
    console.log('[Skynet] Auto-bookmarked:', tab.title);
  } catch (err) {
    console.error('[Skynet] Auto-bookmark failed:', err);
  }
}

async function findOrCreateFolder(name, parentId = null) {
  const searchResults = await chrome.bookmarks.search({ title: name });
  for (let result of searchResults) {
    if (result.url === undefined) { // It's a folder
      if (!parentId || result.parentId === parentId) {
        return result;
      }
    }
  }
  
  // Create new folder
  return await chrome.bookmarks.create({
    parentId: parentId || '1', // Bookmarks bar
    title: name
  });
}

// ============================================
// Shared Tabs & Collaboration
// ============================================

async function createSharedTab(url, sessionName = null) {
  try {
    const tab = await chrome.tabs.create({ url: url, active: true });
    
    const sharedSession = {
      sessionId: generateSessionId(),
      sessionName: sessionName || `Shared-${Date.now()}`,
      tabId: tab.id,
      url: url,
      participants: ['user', 'skynet'],
      created: Date.now(),
      lastActivity: Date.now(),
      actions: []
    };
    
    sharedTabs.set(tab.id, sharedSession);
    
    // Inject collaboration script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: initCollaborationMode,
      args: [sharedSession.sessionId]
    });
    
    // Notify gateway
    send({
      type: 'shared.tab.created',
      session: sharedSession
    });
    
    return sharedSession;
  } catch (err) {
    console.error('[Skynet] Shared tab creation failed:', err);
    throw err;
  }
}

function initCollaborationMode(sessionId) {
  // This runs in the page context
  window.skynetSessionId = sessionId;
  
  // Add visual indicator
  const indicator = document.createElement('div');
  indicator.id = 'skynet-collaboration-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(45deg, #00d4ff, #ff9500);
    color: black;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: monospace;
    font-weight: bold;
    z-index: 999999;
    font-size: 12px;
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
  `;
  indicator.textContent = `🤖 SKYNET SHARED SESSION: ${sessionId.slice(0, 8)}`;
  document.body.appendChild(indicator);
  
  // Track user interactions
  ['click', 'scroll', 'keypress'].forEach(eventType => {
    document.addEventListener(eventType, (e) => {
      chrome.runtime.sendMessage({
        type: 'shared.interaction',
        sessionId: sessionId,
        event: eventType,
        target: e.target.tagName,
        timestamp: Date.now()
      });
    });
  });
}

async function syncSharedTabAction(tabId, action) {
  const session = sharedTabs.get(tabId);
  if (!session) return;
  
  session.actions.push({
    type: action.type,
    data: action.data,
    timestamp: Date.now(),
    participant: action.participant || 'skynet'
  });
  
  session.lastActivity = Date.now();
  
  // Broadcast to all participants
  send({
    type: 'shared.tab.action',
    sessionId: session.sessionId,
    action: action
  });
}

// ============================================
// Remote Debugging System
// ============================================

async function enableRemoteDebugging(tabId, options = {}) {
  try {
    // Attach Chrome DevTools debugger
    await chrome.debugger.attach({ tabId: tabId }, '1.3');
    
    const debugSession = {
      tabId: tabId,
      sessionId: generateSessionId(),
      enabled: true,
      created: Date.now(),
      features: {
        console: options.console !== false,
        network: options.network !== false,
        runtime: options.runtime !== false,
        dom: options.dom !== false,
        performance: options.performance !== false
      },
      logs: []
    };
    
    debugSessions.set(tabId, debugSession);
    
    // Enable debugging domains
    if (debugSession.features.console) {
      await chrome.debugger.sendCommand({ tabId }, 'Console.enable');
      await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');
    }
    
    if (debugSession.features.network) {
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
    }
    
    if (debugSession.features.dom) {
      await chrome.debugger.sendCommand({ tabId }, 'DOM.enable');
    }
    
    // Inject debug console overlay
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: createDebugOverlay,
      args: [debugSession.sessionId]
    });
    
    // Notify gateway
    send({
      type: 'debug.session.created',
      session: debugSession
    });
    
    console.log('[Skynet] Remote debugging enabled for tab:', tabId);
    return debugSession;
  } catch (err) {
    console.error('[Skynet] Remote debugging setup failed:', err);
    throw err;
  }
}

function createDebugOverlay(sessionId) {
  // Create floating debug console
  const overlay = document.createElement('div');
  overlay.id = 'skynet-debug-overlay';
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    height: 300px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00d4ff;
    border-radius: 10px;
    color: #00d4ff;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    z-index: 999999;
    display: none;
    overflow: hidden;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    background: #00d4ff;
    color: black;
    padding: 5px 10px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>🤖 SKYNET DEBUG: ${sessionId.slice(0, 8)}</span>
    <span style="cursor: pointer;" onclick="this.parentElement.parentElement.style.display='none'">✖</span>
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 10px;
    height: 250px;
    overflow-y: auto;
    white-space: pre-wrap;
  `;
  content.id = 'skynet-debug-content';
  
  overlay.appendChild(header);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Toggle debug overlay with Ctrl+Shift+D
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  // Expose debugging functions globally
  window.skynetDebug = {
    sessionId: sessionId,
    log: (message) => {
      content.textContent += `[${new Date().toLocaleTimeString()}] ${message}\n`;
      content.scrollTop = content.scrollHeight;
      
      chrome.runtime.sendMessage({
        type: 'debug.log',
        sessionId: sessionId,
        message: message,
        timestamp: Date.now()
      });
    },
    eval: (code) => {
      try {
        const result = eval(code);
        window.skynetDebug.log(`> ${code}`);
        window.skynetDebug.log(`< ${JSON.stringify(result, null, 2)}`);
        return result;
      } catch (err) {
        window.skynetDebug.log(`> ${code}`);
        window.skynetDebug.log(`! ${err.message}`);
        throw err;
      }
    },
    inspect: (selector) => {
      const element = document.querySelector(selector);
      if (element) {
        window.skynetDebug.log(`Element: ${selector}`);
        window.skynetDebug.log(`Tag: ${element.tagName}`);
        window.skynetDebug.log(`Classes: ${element.className}`);
        window.skynetDebug.log(`Text: ${element.textContent?.slice(0, 100)}...`);
        return element;
      } else {
        window.skynetDebug.log(`Element not found: ${selector}`);
        return null;
      }
    }
  };
}

// ============================================
// WebSocket Connection Management
// ============================================

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  updateState('connecting');
  console.log('[Skynet] Connecting to gateway...');
  
  try {
    ws = new WebSocket(GATEWAY_URL);
    
    ws.onopen = () => {
      console.log('[Skynet] Connected to gateway');
      updateState('connected');
      clearReconnectTimer();
      startHeartbeat();
      
      // Announce ourselves with enhanced capabilities
      send({
        type: 'extension.hello',
        capabilities: [
          'bookmarks', 'tabs', 'auto-bookmarking', 
          'shared-tabs', 'remote-debugging', 'collaboration'
        ],
        version: '2.0.0'
      });
    };
    
    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[Skynet] Received:', msg);
        await handleMessage(msg);
      } catch (err) {
        console.error('[Skynet] Message parse error:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('[Skynet] Connection closed');
      updateState('disconnected');
      stopHeartbeat();
      scheduleReconnect();
    };
    
    ws.onerror = (err) => {
      console.error('[Skynet] WebSocket error:', err);
      updateState('error');
    };
  } catch (err) {
    console.error('[Skynet] Connection failed:', err);
    updateState('error');
    scheduleReconnect();
  }
}

// ============================================
// Enhanced Message Handling
// ============================================

async function handleMessage(msg) {
  try {
    let response = { 
      success: true, 
      action: msg.action,
      requestId: msg.requestId 
    };
    
    switch (msg.action) {
      // Original bookmark/tab commands...
      case 'bookmarks.list':
        response.data = await chrome.bookmarks.getTree();
        break;
      
      case 'bookmarks.search':
        response.data = await chrome.bookmarks.search(msg.query || '');
        break;
        
      case 'tabs.list':
        response.data = await chrome.tabs.query({});
        break;
        
      // New enhanced features
      case 'auto-bookmark.enable':
        await enableAutoBookmarking(msg.options || {});
        response.data = { enabled: true };
        break;
        
      case 'auto-bookmark.disable':
        await disableAutoBookmarking();
        response.data = { enabled: false };
        break;
        
      case 'shared.tab.create':
        response.data = await createSharedTab(msg.url, msg.sessionName);
        break;
        
      case 'shared.tab.join':
        response.data = await joinSharedTab(msg.sessionId);
        break;
        
      case 'debug.enable':
        response.data = await enableRemoteDebugging(msg.tabId, msg.options);
        break;
        
      case 'debug.execute':
        response.data = await executeDebugCommand(msg.tabId, msg.command);
        break;
        
      case 'debug.inject':
        response.data = await injectDebugScript(msg.tabId, msg.script);
        break;
        
      // Auto-updater commands
      case 'update.check':
        response.data = await autoUpdater?.manualUpdateCheck();
        break;
        
      case 'update.download':
        await autoUpdater?.downloadAvailableUpdate();
        response.data = { status: 'download_started' };
        break;
        
      case 'update.settings.get':
        response.data = await autoUpdater?.getUpdateSettings();
        break;
        
      case 'update.settings.update':
        await autoUpdater?.updateSettings(msg.settings);
        response.data = { status: 'settings_updated' };
        break;
        
      case 'update.history':
        response.data = await autoUpdater?.getUpdateHistory();
        break;
        
      case 'update.rollback':
        await autoUpdater?.rollbackUpdate(msg.version);
        response.data = { status: 'rollback_initiated' };
        break;
        
      case 'update.download.link':
        response.data = await autoUpdater?.generateUpdateDownloadLink();
        break;
        
      default:
        response.success = false;
        response.error = `Unknown action: ${msg.action}`;
    }
    
    send(response);
  } catch (err) {
    console.error('[Skynet] Command failed:', err);
    send({
      success: false,
      action: msg.action,
      requestId: msg.requestId,
      error: err.message
    });
  }
}

// ============================================
// Event Listeners & Auto-Detection
// ============================================

// Tab update listener for auto-bookmarking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Delayed analysis to let page load fully
    setTimeout(() => {
      analyzeAndBookmarkTab(tabId, tab);
    }, AUTO_BOOKMARK_DELAY);
  }
});

// Track session duration
const tabSessions = new Map();
chrome.tabs.onActivated.addListener(({ tabId }) => {
  tabSessions.set(tabId, Date.now());
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabSessions.delete(tabId);
  sharedTabs.delete(tabId);
  debugSessions.delete(tabId);
});

// Debugger event handling
chrome.debugger.onEvent.addListener((source, method, params) => {
  const session = debugSessions.get(source.tabId);
  if (!session) return;
  
  // Forward relevant debugging events to gateway
  if (method === 'Console.messageAdded' || 
      method === 'Runtime.consoleAPICalled' || 
      method === 'Network.responseReceived') {
    
    session.logs.push({
      method: method,
      params: params,
      timestamp: Date.now()
    });
    
    send({
      type: 'debug.event',
      sessionId: session.sessionId,
      method: method,
      params: params
    });
  }
});

// ============================================
// Utility Functions
// ============================================

function generateSessionId() {
  return 'skynet_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

async function checkSessionDuration(tabId) {
  const startTime = tabSessions.get(tabId);
  return startTime ? Date.now() - startTime : 0;
}

async function checkTabInteraction(tabId) {
  // This would require more sophisticated tracking
  // For now, assume any tab that's been active has had interaction
  return tabSessions.has(tabId);
}

function send(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function updateState(state) {
  connectionState = state;
  chrome.runtime.sendMessage({ type: 'state-update', state: state });
}

// Additional utility functions...
function disconnect() {
  clearReconnectTimer();
  stopHeartbeat();
  if (ws) {
    ws.close();
    ws = null;
  }
  updateState('disconnected');
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  console.log(`[Skynet] Reconnecting in ${RECONNECT_DELAY}ms...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      send({ type: 'ping' });
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ============================================
// Initialization
// ============================================

// Initialize auto-updater
initializeAutoUpdater();

// Start connection when extension loads
connect();

console.log('[Skynet] Enhanced Browser Manager with Auto-Updater initialized');