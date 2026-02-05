// Skynet Browser Manager - Background Service Worker
// WebSocket connection to Clawdbot gateway + command handling

const GATEWAY_URL = 'ws://10.10.10.123:18789/extension';
const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 30000;

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let connectionState = 'disconnected';

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
      
      // Announce ourselves
      send({
        type: 'extension.hello',
        capabilities: ['bookmarks', 'tabs'],
        version: '1.0.0'
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

function send(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
}

function updateState(state) {
  connectionState = state;
  // Notify popup if open
  chrome.runtime.sendMessage({ type: 'state', state }).catch(() => {});
}

// ============================================
// Message Handler - Command Router
// ============================================

async function handleMessage(msg) {
  const { action, requestId, ...params } = msg;
  
  if (!action) return;
  
  let response;
  try {
    switch (action) {
      // Bookmark operations
      case 'bookmarks.list':
        response = await bookmarksList();
        break;
      case 'bookmarks.search':
        response = await bookmarksSearch(params.query);
        break;
      case 'bookmarks.add':
        response = await bookmarksAdd(params.url, params.title, params.folder);
        break;
      case 'bookmarks.delete':
        response = await bookmarksDelete(params.id);
        break;
      case 'bookmarks.move':
        response = await bookmarksMove(params.id, params.parentId, params.index);
        break;
      case 'bookmarks.duplicates':
        response = await bookmarksFindDuplicates();
        break;
      
      // Tab operations
      case 'tabs.list':
        response = await tabsList();
        break;
      case 'tabs.create':
        response = await tabsCreate(params.url, params.active);
        break;
      case 'tabs.close':
        response = await tabsClose(params.tabId || params.tabIds);
        break;
      case 'tabs.focus':
        response = await tabsFocus(params.tabId);
        break;
      case 'tabs.groupByDomain':
        response = await tabsGroupByDomain();
        break;
      
      // Status
      case 'status':
        response = { success: true, data: { state: connectionState, version: '1.0.0' } };
        break;
      
      default:
        response = { success: false, error: `Unknown action: ${action}` };
    }
  } catch (err) {
    console.error(`[Skynet] Action ${action} failed:`, err);
    response = { success: false, error: err.message };
  }
  
  // Send response with requestId if provided
  if (requestId) {
    response.requestId = requestId;
  }
  response.action = action;
  send(response);
}

// ============================================
// Bookmark Operations
// ============================================

async function bookmarksList() {
  const tree = await chrome.bookmarks.getTree();
  return { success: true, data: tree };
}

async function bookmarksSearch(query) {
  if (!query) {
    return { success: false, error: 'Query required' };
  }
  const results = await chrome.bookmarks.search(query);
  return { success: true, data: results };
}

async function bookmarksAdd(url, title, folder) {
  if (!url) {
    return { success: false, error: 'URL required' };
  }
  
  let parentId = '1'; // Default to Bookmarks Bar
  
  // If folder specified, find or create it
  if (folder) {
    const existing = await chrome.bookmarks.search({ title: folder });
    const folderNode = existing.find(b => !b.url);
    if (folderNode) {
      parentId = folderNode.id;
    } else {
      // Create the folder
      const newFolder = await chrome.bookmarks.create({ parentId: '1', title: folder });
      parentId = newFolder.id;
    }
  }
  
  const bookmark = await chrome.bookmarks.create({
    parentId,
    title: title || url,
    url
  });
  
  return { success: true, data: bookmark };
}

async function bookmarksDelete(id) {
  if (!id) {
    return { success: false, error: 'Bookmark ID required' };
  }
  await chrome.bookmarks.remove(id);
  return { success: true };
}

async function bookmarksMove(id, parentId, index) {
  if (!id) {
    return { success: false, error: 'Bookmark ID required' };
  }
  const destination = {};
  if (parentId) destination.parentId = parentId;
  if (index !== undefined) destination.index = index;
  
  const result = await chrome.bookmarks.move(id, destination);
  return { success: true, data: result };
}

async function bookmarksFindDuplicates() {
  const tree = await chrome.bookmarks.getTree();
  const urlMap = new Map();
  
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.url) {
        // Normalize URL for comparison
        const normalizedUrl = node.url.replace(/\/$/, '').toLowerCase();
        if (!urlMap.has(normalizedUrl)) {
          urlMap.set(normalizedUrl, []);
        }
        urlMap.set(normalizedUrl, [...urlMap.get(normalizedUrl), {
          id: node.id,
          title: node.title,
          url: node.url,
          dateAdded: node.dateAdded
        }]);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  
  // Filter to only duplicates
  const duplicates = [];
  for (const [url, bookmarks] of urlMap) {
    if (bookmarks.length > 1) {
      duplicates.push({ url, count: bookmarks.length, bookmarks });
    }
  }
  
  return { success: true, data: { duplicates, totalDuplicates: duplicates.length } };
}

// ============================================
// Tab Operations
// ============================================

async function tabsList() {
  const tabs = await chrome.tabs.query({});
  const simplified = tabs.map(t => ({
    id: t.id,
    windowId: t.windowId,
    title: t.title,
    url: t.url,
    active: t.active,
    pinned: t.pinned,
    favIconUrl: t.favIconUrl
  }));
  return { success: true, data: simplified };
}

async function tabsCreate(url, active = true) {
  const tab = await chrome.tabs.create({ url, active });
  return { success: true, data: { id: tab.id, url: tab.url } };
}

async function tabsClose(tabIds) {
  if (!tabIds) {
    return { success: false, error: 'Tab ID(s) required' };
  }
  const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
  await chrome.tabs.remove(ids);
  return { success: true, data: { closed: ids.length } };
}

async function tabsFocus(tabId) {
  if (!tabId) {
    return { success: false, error: 'Tab ID required' };
  }
  const tab = await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  return { success: true };
}

async function tabsGroupByDomain() {
  const tabs = await chrome.tabs.query({});
  const domainMap = new Map();
  
  for (const tab of tabs) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain).push(tab.id);
    } catch {
      // Skip invalid URLs (chrome://, etc.)
    }
  }
  
  const groups = [];
  for (const [domain, tabIds] of domainMap) {
    if (tabIds.length > 1) {
      groups.push({ domain, count: tabIds.length, tabIds });
    }
  }
  
  return { success: true, data: { groups, totalGroups: groups.length } };
}

// ============================================
// Message Handler for Popup Communication
// ============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    sendResponse({ state: connectionState });
  } else if (msg.type === 'connect') {
    connect();
    sendResponse({ ok: true });
  } else if (msg.type === 'disconnect') {
    disconnect();
    sendResponse({ ok: true });
  } else if (msg.type === 'getBookmarks') {
    bookmarksList().then(sendResponse);
    return true; // async response
  } else if (msg.type === 'getTabs') {
    tabsList().then(sendResponse);
    return true;
  } else if (msg.type === 'getDuplicates') {
    bookmarksFindDuplicates().then(sendResponse);
    return true;
  }
  return false;
});

// ============================================
// Startup
// ============================================

console.log('[Skynet] Browser Manager starting...');
connect();
