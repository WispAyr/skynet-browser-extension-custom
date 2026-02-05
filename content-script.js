// Skynet Browser Manager - Content Script
// Runs on all pages to enable advanced collaboration and debugging features

(function() {
  'use strict';
  
  let skynetEnabled = false;
  let collaborationMode = false;
  let debugMode = false;
  let sessionId = null;
  
  // ============================================
  // Page Analysis for Auto-Bookmarking
  // ============================================
  
  function analyzePageForBookmarking() {
    const analysis = {
      isWorkRelated: false,
      confidence: 0,
      factors: [],
      pageInfo: {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        timeSpent: 0,
        interactions: 0,
        codeElements: 0,
        techKeywords: 0
      }
    };
    
    // Check for development/work-related content
    const workKeywords = [
      'github', 'api', 'documentation', 'tutorial', 'guide',
      'stackoverflow', 'javascript', 'python', 'react', 'vue',
      'angular', 'nodejs', 'docker', 'kubernetes', 'aws'
    ];
    
    const pageText = document.body.textContent.toLowerCase();
    const titleLower = document.title.toLowerCase();
    const urlLower = window.location.href.toLowerCase();
    
    // Keyword analysis
    workKeywords.forEach(keyword => {
      if (titleLower.includes(keyword) || urlLower.includes(keyword) || pageText.includes(keyword)) {
        analysis.factors.push(`Contains keyword: ${keyword}`);
        analysis.pageInfo.techKeywords++;
        analysis.confidence += 10;
      }
    });
    
    // Code element detection
    const codeElements = document.querySelectorAll('code, pre, .highlight, .code, .syntax');
    if (codeElements.length > 0) {
      analysis.factors.push(`Code elements found: ${codeElements.length}`);
      analysis.pageInfo.codeElements = codeElements.length;
      analysis.confidence += Math.min(codeElements.length * 5, 30);
    }
    
    // Development domain detection
    const devDomains = [
      'github.com', 'stackoverflow.com', 'docs.google.com',
      'developer.mozilla.org', 'w3schools.com', 'codepen.io'
    ];
    
    if (devDomains.some(domain => window.location.hostname.includes(domain))) {
      analysis.factors.push(`Development domain: ${window.location.hostname}`);
      analysis.confidence += 25;
    }
    
    // Page structure analysis
    if (document.querySelector('nav, .navbar, .navigation')) {
      analysis.factors.push('Has navigation structure');
      analysis.confidence += 5;
    }
    
    if (document.querySelector('article, .article, .post, .content')) {
      analysis.factors.push('Has article/content structure');
      analysis.confidence += 5;
    }
    
    analysis.isWorkRelated = analysis.confidence >= 20;
    
    return analysis;
  }
  
  // ============================================
  // Collaboration Features
  // ============================================
  
  function enableCollaborationMode(sessionData) {
    if (collaborationMode) return;
    
    collaborationMode = true;
    sessionId = sessionData.sessionId;
    
    createCollaborationOverlay(sessionData);
    setupInteractionTracking();
    setupScrollSync();
    setupClickSharing();
    
    console.log('[Skynet] Collaboration mode enabled for session:', sessionId);
  }
  
  function createCollaborationOverlay(sessionData) {
    // Remove existing overlay
    const existingOverlay = document.getElementById('skynet-collaboration-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'skynet-collaboration-overlay';
    overlay.innerHTML = `
      <div class="skynet-collab-header">
        <div class="skynet-collab-title">🤖 SKYNET COLLABORATION</div>
        <div class="skynet-collab-session">Session: ${sessionData.sessionId.slice(0, 8)}</div>
        <div class="skynet-collab-participants">${sessionData.participants.join(', ')}</div>
        <button class="skynet-collab-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
      <div class="skynet-collab-tools">
        <button class="skynet-tool-btn" id="skynet-sync-scroll">📜 Sync Scroll</button>
        <button class="skynet-tool-btn" id="skynet-share-clicks">👆 Share Clicks</button>
        <button class="skynet-tool-btn" id="skynet-highlight-mode">✨ Highlight</button>
        <button class="skynet-tool-btn" id="skynet-voice-chat">🎙️ Voice</button>
      </div>
      <div class="skynet-collab-activity" id="skynet-activity-log">
        <div class="skynet-activity-item">Collaboration session started</div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #skynet-collaboration-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #00d4ff;
        border-radius: 10px;
        color: #00d4ff;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 999999;
        backdrop-filter: blur(10px);
      }
      
      .skynet-collab-header {
        background: linear-gradient(45deg, #00d4ff, #ff9500);
        color: black;
        padding: 10px;
        border-radius: 8px 8px 0 0;
        position: relative;
      }
      
      .skynet-collab-title {
        font-weight: bold;
        font-size: 13px;
      }
      
      .skynet-collab-session, .skynet-collab-participants {
        font-size: 10px;
        margin-top: 2px;
      }
      
      .skynet-collab-close {
        position: absolute;
        right: 8px;
        top: 8px;
        background: transparent;
        border: none;
        color: black;
        cursor: pointer;
        font-size: 16px;
      }
      
      .skynet-collab-tools {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        padding: 10px;
        border-bottom: 1px solid #333;
      }
      
      .skynet-tool-btn {
        background: rgba(0, 212, 255, 0.1);
        border: 1px solid #00d4ff;
        color: #00d4ff;
        padding: 5px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.2s ease;
      }
      
      .skynet-tool-btn:hover {
        background: rgba(0, 212, 255, 0.2);
      }
      
      .skynet-tool-btn.active {
        background: #00d4ff;
        color: black;
      }
      
      .skynet-collab-activity {
        max-height: 150px;
        overflow-y: auto;
        padding: 10px;
      }
      
      .skynet-activity-item {
        padding: 2px 0;
        font-size: 10px;
        border-bottom: 1px solid #333;
        margin-bottom: 3px;
      }
      
      .skynet-highlight {
        background: rgba(255, 149, 0, 0.3) !important;
        border: 2px dashed #ff9500;
        animation: skynetPulse 1s ease-in-out infinite alternate;
      }
      
      @keyframes skynetPulse {
        0% { box-shadow: 0 0 5px rgba(255, 149, 0, 0.5); }
        100% { box-shadow: 0 0 20px rgba(255, 149, 0, 0.8); }
      }
      
      .skynet-cursor {
        position: absolute;
        width: 20px;
        height: 20px;
        background: #ff9500;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999998;
        animation: skynetCursorPulse 1s ease-in-out infinite;
      }
      
      @keyframes skynetCursorPulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0.5; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    // Setup tool button handlers
    setupCollaborationTools();
  }
  
  function setupCollaborationTools() {
    document.getElementById('skynet-sync-scroll')?.addEventListener('click', function() {
      this.classList.toggle('active');
      toggleScrollSync(this.classList.contains('active'));
    });
    
    document.getElementById('skynet-share-clicks')?.addEventListener('click', function() {
      this.classList.toggle('active');
      toggleClickSharing(this.classList.contains('active'));
    });
    
    document.getElementById('skynet-highlight-mode')?.addEventListener('click', function() {
      this.classList.toggle('active');
      toggleHighlightMode(this.classList.contains('active'));
    });
  }
  
  function setupInteractionTracking() {
    let interactionCount = 0;
    
    // Track various interactions
    ['click', 'scroll', 'keydown', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        interactionCount++;
        
        // Send to background script
        chrome.runtime.sendMessage({
          type: 'collaboration.interaction',
          sessionId: sessionId,
          event: {
            type: eventType,
            timestamp: Date.now(),
            target: e.target.tagName,
            x: e.clientX,
            y: e.clientY
          }
        });
      }, { passive: true });
    });
  }
  
  function setupScrollSync() {
    let isScrollSyncing = false;
    
    window.addEventListener('scroll', () => {
      if (!isScrollSyncing && collaborationMode) {
        chrome.runtime.sendMessage({
          type: 'collaboration.scroll',
          sessionId: sessionId,
          scrollTop: window.pageYOffset,
          scrollLeft: window.pageXOffset,
          timestamp: Date.now()
        });
      }
    });
    
    // Listen for remote scroll events
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'collaboration.scroll.remote' && message.sessionId === sessionId) {
        isScrollSyncing = true;
        window.scrollTo(message.scrollLeft, message.scrollTop);
        setTimeout(() => { isScrollSyncing = false; }, 100);
      }
    });
  }
  
  function setupClickSharing() {
    document.addEventListener('click', (e) => {
      if (collaborationMode) {
        // Create visual indicator
        createClickIndicator(e.clientX, e.clientY);
        
        chrome.runtime.sendMessage({
          type: 'collaboration.click',
          sessionId: sessionId,
          x: e.clientX,
          y: e.clientY,
          target: e.target.tagName,
          timestamp: Date.now()
        });
      }
    });
    
    // Listen for remote clicks
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'collaboration.click.remote' && message.sessionId === sessionId) {
        createRemoteClickIndicator(message.x, message.y);
      }
    });
  }
  
  function createClickIndicator(x, y) {
    const indicator = document.createElement('div');
    indicator.className = 'skynet-cursor';
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 1000);
  }
  
  function createRemoteClickIndicator(x, y) {
    const indicator = document.createElement('div');
    indicator.className = 'skynet-cursor';
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    indicator.style.background = '#00d4ff';
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 1500);
  }
  
  // ============================================
  // Advanced Debug Tools
  // ============================================
  
  function enableAdvancedDebugMode(options = {}) {
    if (debugMode) return;
    
    debugMode = true;
    
    createDebugInterface();
    
    if (options.console) setupConsoleInterception();
    if (options.network) setupNetworkMonitoring();
    if (options.dom) setupDOMWatcher();
    if (options.performance) setupPerformanceMonitoring();
    
    console.log('[Skynet] Advanced debug mode enabled');
  }
  
  function createDebugInterface() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'skynet-debug-panel';
    debugPanel.innerHTML = `
      <div class="skynet-debug-header">
        <span>🔧 SKYNET DEBUG</span>
        <button onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
      <div class="skynet-debug-tabs">
        <button class="skynet-debug-tab active" data-tab="console">Console</button>
        <button class="skynet-debug-tab" data-tab="network">Network</button>
        <button class="skynet-debug-tab" data-tab="dom">DOM</button>
        <button class="skynet-debug-tab" data-tab="performance">Perf</button>
      </div>
      <div class="skynet-debug-content">
        <div class="skynet-debug-console" id="skynet-debug-console-content">
          <div class="skynet-debug-line">Debug console initialized</div>
        </div>
      </div>
      <div class="skynet-debug-input">
        <input type="text" id="skynet-debug-command" placeholder="JavaScript command...">
        <button onclick="executeSkynetCommand()">Execute</button>
      </div>
    `;
    
    // Add debug panel styles
    const debugStyle = document.createElement('style');
    debugStyle.textContent = `
      #skynet-debug-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 450px;
        height: 350px;
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #ff9500;
        border-radius: 8px;
        color: #ff9500;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
      }
      
      .skynet-debug-header {
        background: linear-gradient(45deg, #ff9500, #ffaa33);
        color: black;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        font-weight: bold;
      }
      
      .skynet-debug-tabs {
        display: flex;
        background: #111;
        border-bottom: 1px solid #333;
      }
      
      .skynet-debug-tab {
        flex: 1;
        background: transparent;
        border: none;
        color: #888;
        padding: 8px;
        cursor: pointer;
        font-family: inherit;
      }
      
      .skynet-debug-tab.active {
        color: #ff9500;
        background: rgba(255, 149, 0, 0.1);
      }
      
      .skynet-debug-content {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }
      
      .skynet-debug-console {
        font-family: 'Courier New', monospace;
        font-size: 10px;
        line-height: 1.4;
      }
      
      .skynet-debug-line {
        margin-bottom: 3px;
        word-wrap: break-word;
      }
      
      .skynet-debug-line.error {
        color: #ff6666;
      }
      
      .skynet-debug-line.warning {
        color: #ffaa00;
      }
      
      .skynet-debug-line.info {
        color: #00d4ff;
      }
      
      .skynet-debug-input {
        display: flex;
        border-top: 1px solid #333;
      }
      
      .skynet-debug-input input {
        flex: 1;
        background: transparent;
        border: none;
        color: #ff9500;
        padding: 8px;
        font-family: inherit;
      }
      
      .skynet-debug-input button {
        background: #ff9500;
        border: none;
        color: black;
        padding: 8px 12px;
        cursor: pointer;
        font-family: inherit;
        font-size: 10px;
      }
    `;
    
    document.head.appendChild(debugStyle);
    document.body.appendChild(debugPanel);
    
    // Make executeSkynetCommand global
    window.executeSkynetCommand = () => {
      const input = document.getElementById('skynet-debug-command');
      const command = input.value.trim();
      
      if (command) {
        try {
          addDebugLine(`> ${command}`);
          const result = eval(command);
          addDebugLine(`< ${JSON.stringify(result, null, 2)}`, 'info');
        } catch (err) {
          addDebugLine(`! ${err.message}`, 'error');
        }
        input.value = '';
      }
    };
    
    // Enter key support
    document.getElementById('skynet-debug-command').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.executeSkynetCommand();
      }
    });
  }
  
  function addDebugLine(text, type = '') {
    const console = document.getElementById('skynet-debug-console-content');
    if (!console) return;
    
    const line = document.createElement('div');
    line.className = `skynet-debug-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
    
    // Also send to background script
    chrome.runtime.sendMessage({
      type: 'debug.console.log',
      message: text,
      level: type || 'log',
      timestamp: Date.now()
    });
  }
  
  function setupConsoleInterception() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      addDebugLine(args.join(' '), 'info');
      originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
      addDebugLine(args.join(' '), 'error');
      originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
      addDebugLine(args.join(' '), 'warning');
      originalWarn.apply(console, args);
    };
  }
  
  // ============================================
  // Message Handling
  // ============================================
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'enable-collaboration':
        enableCollaborationMode(message.sessionData);
        sendResponse({ success: true });
        break;
        
      case 'enable-debug':
        enableAdvancedDebugMode(message.options);
        sendResponse({ success: true });
        break;
        
      case 'analyze-page':
        const analysis = analyzePageForBookmarking();
        sendResponse({ success: true, data: analysis });
        break;
        
      case 'highlight-element':
        if (message.selector) {
          const element = document.querySelector(message.selector);
          if (element) {
            element.classList.add('skynet-highlight');
            setTimeout(() => {
              element.classList.remove('skynet-highlight');
            }, 3000);
          }
        }
        sendResponse({ success: true });
        break;
    }
  });
  
  // ============================================
  // Auto-initialization
  // ============================================
  
  // Check if page should be auto-analyzed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const analysis = analyzePageForBookmarking();
        if (analysis.isWorkRelated) {
          chrome.runtime.sendMessage({
            type: 'page.analysis',
            data: analysis
          });
        }
      }, 2000);
    });
  } else {
    setTimeout(() => {
      const analysis = analyzePageForBookmarking();
      if (analysis.isWorkRelated) {
        chrome.runtime.sendMessage({
          type: 'page.analysis',
          data: analysis
        });
      }
    }, 2000);
  }
  
  console.log('[Skynet] Content script loaded and ready');
  
})();