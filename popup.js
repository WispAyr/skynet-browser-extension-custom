// Skynet Browser Manager - Popup UI Logic

document.addEventListener('DOMContentLoaded', init);

// State
let currentTab = 'bookmarks';
let bookmarksCache = null;
let tabsCache = null;

// ============================================
// Initialization
// ============================================

function init() {
  // Get initial connection state
  chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
    updateConnectionUI(response?.state || 'disconnected');
  });

  // Listen for state updates
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'state') {
      updateConnectionUI(msg.state);
    }
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Connect button
  document.getElementById('connectBtn').addEventListener('click', toggleConnection);

  // Refresh buttons
  document.getElementById('refreshBookmarks').addEventListener('click', loadBookmarks);
  document.getElementById('refreshTabs').addEventListener('click', loadTabs);

  // Search
  document.getElementById('bookmarkSearch').addEventListener('input', debounce(filterBookmarks, 300));

  // Tools
  document.getElementById('findDuplicates').addEventListener('click', findDuplicates);
  document.getElementById('groupTabs').addEventListener('click', groupTabsByDomain);
  document.getElementById('exportBookmarks').addEventListener('click', exportData);

  // Initial load
  loadBookmarks();
}

// ============================================
// Connection UI
// ============================================

function updateConnectionUI(state) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const btn = document.getElementById('connectBtn');

  dot.className = 'status-dot';
  
  switch (state) {
    case 'connected':
      dot.classList.add('connected');
      text.textContent = 'CONNECTED';
      btn.textContent = 'DISCONNECT';
      break;
    case 'connecting':
      dot.classList.add('connecting');
      text.textContent = 'CONNECTING...';
      btn.textContent = 'CANCEL';
      break;
    case 'error':
      text.textContent = 'ERROR';
      btn.textContent = 'RETRY';
      break;
    default:
      text.textContent = 'DISCONNECTED';
      btn.textContent = 'CONNECT';
  }
}

function toggleConnection() {
  const text = document.getElementById('statusText').textContent;
  if (text === 'CONNECTED' || text === 'CONNECTING...') {
    chrome.runtime.sendMessage({ type: 'disconnect' });
  } else {
    chrome.runtime.sendMessage({ type: 'connect' });
  }
}

// ============================================
// Tab Navigation
// ============================================

function switchTab(tab) {
  currentTab = tab;
  
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Update panels
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `${tab}-panel`);
  });
  
  // Load data if needed
  if (tab === 'bookmarks' && !bookmarksCache) {
    loadBookmarks();
  } else if (tab === 'tabs') {
    loadTabs();
  }
}

// ============================================
// Bookmark Management
// ============================================

async function loadBookmarks() {
  const container = document.getElementById('bookmarkList');
  container.innerHTML = '<div class="loading">Loading bookmarks...</div>';
  
  chrome.runtime.sendMessage({ type: 'getBookmarks' }, (response) => {
    if (response?.success && response.data) {
      bookmarksCache = response.data;
      renderBookmarks(response.data);
    } else {
      container.innerHTML = '<div class="loading">Failed to load bookmarks</div>';
    }
  });
}

function renderBookmarks(tree, searchFilter = '') {
  const container = document.getElementById('bookmarkList');
  container.innerHTML = '';
  
  let count = 0;
  
  function renderNode(node, depth = 0) {
    if (node.url) {
      // Bookmark
      if (searchFilter && !node.title.toLowerCase().includes(searchFilter) && 
          !node.url.toLowerCase().includes(searchFilter)) {
        return null;
      }
      count++;
      const item = createBookmarkItem(node);
      return item;
    } else if (node.children && node.children.length > 0) {
      // Folder
      const folder = document.createElement('div');
      folder.className = 'folder-item';
      
      if (node.title) {
        const header = document.createElement('div');
        header.className = 'folder-header';
        header.innerHTML = `
          <span class="folder-icon">▼</span>
          <span>${escapeHtml(node.title)}</span>
          <span style="color: var(--lcars-text-dim); font-size: 10px;">(${node.children.length})</span>
        `;
        header.addEventListener('click', () => folder.classList.toggle('collapsed'));
        folder.appendChild(header);
      }
      
      const contents = document.createElement('div');
      contents.className = 'folder-contents';
      
      let hasVisibleChildren = false;
      for (const child of node.children) {
        const childEl = renderNode(child, depth + 1);
        if (childEl) {
          contents.appendChild(childEl);
          hasVisibleChildren = true;
        }
      }
      
      if (!hasVisibleChildren && searchFilter) return null;
      
      folder.appendChild(contents);
      return folder;
    }
    return null;
  }
  
  for (const root of tree) {
    const el = renderNode(root);
    if (el) container.appendChild(el);
  }
  
  document.getElementById('bookmarkCount').textContent = `${count} bookmarks`;
}

function createBookmarkItem(bookmark) {
  const item = document.createElement('div');
  item.className = 'list-item';
  
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=16`;
  
  item.innerHTML = `
    <img class="favicon" src="${faviconUrl}" onerror="this.style.display='none'">
    <div class="info">
      <div class="title">${escapeHtml(bookmark.title || 'Untitled')}</div>
      <div class="url">${escapeHtml(bookmark.url)}</div>
    </div>
    <div class="actions">
      <button class="action-btn" title="Open" data-action="open">↗</button>
      <button class="action-btn danger" title="Delete" data-action="delete">×</button>
    </div>
  `;
  
  item.querySelector('[data-action="open"]').addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.tabs.create({ url: bookmark.url });
  });
  
  item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
      chrome.bookmarks.remove(bookmark.id, () => {
        item.remove();
        loadBookmarks();
      });
    }
  });
  
  return item;
}

function filterBookmarks(e) {
  const query = e.target.value.toLowerCase().trim();
  if (bookmarksCache) {
    renderBookmarks(bookmarksCache, query);
  }
}

// ============================================
// Tab Management
// ============================================

async function loadTabs() {
  const container = document.getElementById('tabList');
  container.innerHTML = '<div class="loading">Loading tabs...</div>';
  
  chrome.runtime.sendMessage({ type: 'getTabs' }, (response) => {
    if (response?.success && response.data) {
      tabsCache = response.data;
      renderTabs(response.data);
    } else {
      container.innerHTML = '<div class="loading">Failed to load tabs</div>';
    }
  });
}

function renderTabs(tabs) {
  const container = document.getElementById('tabList');
  container.innerHTML = '';
  
  for (const tab of tabs) {
    const item = document.createElement('div');
    item.className = 'list-item';
    
    item.innerHTML = `
      <img class="favicon" src="${tab.favIconUrl || ''}" onerror="this.style.display='none'">
      <div class="info">
        <div class="title">${escapeHtml(tab.title || 'Untitled')}</div>
        <div class="url">${escapeHtml(tab.url || '')}</div>
      </div>
      <div class="actions">
        <button class="action-btn" title="Focus" data-action="focus">→</button>
        <button class="action-btn danger" title="Close" data-action="close">×</button>
      </div>
    `;
    
    item.querySelector('[data-action="focus"]').addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    });
    
    item.querySelector('[data-action="close"]').addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.tabs.remove(tab.id, () => {
        item.remove();
        loadTabs();
      });
    });
    
    container.appendChild(item);
  }
  
  document.getElementById('tabCount').textContent = `${tabs.length} tabs`;
}

// ============================================
// Tools
// ============================================

function findDuplicates() {
  const results = document.getElementById('toolResults');
  results.innerHTML = '<div class="loading">Scanning for duplicates...</div>';
  
  chrome.runtime.sendMessage({ type: 'getDuplicates' }, (response) => {
    if (response?.success && response.data) {
      const { duplicates, totalDuplicates } = response.data;
      
      if (totalDuplicates === 0) {
        results.innerHTML = '<div class="placeholder">✓ No duplicate bookmarks found!</div>';
        return;
      }
      
      results.innerHTML = `<div style="margin-bottom: 8px; color: var(--lcars-orange);">Found ${totalDuplicates} duplicate URLs:</div>`;
      
      for (const dup of duplicates.slice(0, 20)) {
        const group = document.createElement('div');
        group.className = 'duplicate-group';
        group.innerHTML = `
          <div class="duplicate-url">${escapeHtml(dup.url)}</div>
          <div class="duplicate-count">${dup.count} copies</div>
        `;
        
        for (const bm of dup.bookmarks) {
          const item = document.createElement('div');
          item.style.cssText = 'font-size: 10px; padding: 2px 0; color: var(--lcars-text-dim);';
          item.textContent = `• ${bm.title}`;
          group.appendChild(item);
        }
        
        results.appendChild(group);
      }
    } else {
      results.innerHTML = '<div class="placeholder">Failed to scan bookmarks</div>';
    }
  });
}

function groupTabsByDomain() {
  const results = document.getElementById('toolResults');
  results.innerHTML = '<div class="loading">Analyzing tabs...</div>';
  
  if (!tabsCache) {
    chrome.runtime.sendMessage({ type: 'getTabs' }, (response) => {
      if (response?.success) {
        tabsCache = response.data;
        displayDomainGroups(tabsCache);
      }
    });
  } else {
    displayDomainGroups(tabsCache);
  }
}

function displayDomainGroups(tabs) {
  const results = document.getElementById('toolResults');
  const domainMap = new Map();
  
  for (const tab of tabs) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain).push(tab);
    } catch {}
  }
  
  // Sort by count
  const sorted = [...domainMap.entries()].sort((a, b) => b[1].length - a[1].length);
  
  results.innerHTML = '';
  
  for (const [domain, domainTabs] of sorted) {
    if (domainTabs.length < 2) continue;
    
    const group = document.createElement('div');
    group.className = 'domain-group';
    group.innerHTML = `
      <div class="domain-header">
        <span class="domain-name">${escapeHtml(domain)}</span>
        <span class="domain-count">${domainTabs.length} tabs</span>
      </div>
    `;
    
    for (const tab of domainTabs) {
      const item = document.createElement('div');
      item.style.cssText = 'font-size: 10px; padding: 2px 0; color: var(--lcars-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      item.textContent = `• ${tab.title}`;
      group.appendChild(item);
    }
    
    results.appendChild(group);
  }
  
  if (results.children.length === 0) {
    results.innerHTML = '<div class="placeholder">No duplicate domains found</div>';
  }
}

function exportData() {
  const results = document.getElementById('toolResults');
  
  const data = {
    exportDate: new Date().toISOString(),
    bookmarks: bookmarksCache,
    tabs: tabsCache
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `skynet-browser-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  
  results.innerHTML = '<div class="placeholder">✓ Data exported successfully!</div>';
}

// ============================================
// Utilities
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
