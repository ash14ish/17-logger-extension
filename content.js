let isLogging = false;
let lastActivityTime = Date.now();
let idleCheckInterval;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startLogging') {
    startLogging();
    sendResponse({success: true});
  } 
  else if (request.action === 'stopLogging') {
    stopLogging();
    sendResponse({success: true});
  }
  else if (request.action === 'getStats') {
    getStats().then(sendResponse);
    return true;
  }
  else if (request.action === 'checkLoggingState') {
    chrome.storage.local.get(['isLogging'], (result) => {
      if (result.isLogging) {
        startLogging();
      }
    });
  }
  else if (request.action === 'logIdleTime') {
    console.log('User is idle for:', request.idleTime, 'minutes');
  }
});

function startLogging() {
  isLogging = true;
  updateLastActivity();
  console.log('Content Script: Logging Started');
  addEventListeners();
}

function stopLogging() {
  isLogging = false;
  console.log('Content Script: Logging Stopped');
  removeEventListeners();
  getStats().then(stats => {
    console.log('Final Stats:', {
      ...stats,
      url: window.location.href,
      title: document.title
    });
  });
}

function addEventListeners() {
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('scroll', handleActivity);
  document.addEventListener('mousemove', handleActivity);
}

function removeEventListeners() {
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('scroll', handleActivity);
  document.removeEventListener('mousemove', handleActivity);
}

function handleClick() {
  if (!isLogging) return;
  chrome.storage.local.get(['mouseClicks'], (result) => {
    const newClickCount = (result.mouseClicks || 0) + 1;
    chrome.storage.local.set({mouseClicks: newClickCount});
    console.log('Mouse Clicks:', newClickCount);
  });
  handleActivity();
}

function handleKeydown(event) {
  if (!isLogging) return;
  const key = event.key;
  
  chrome.storage.local.get(['keystrokes', 'accumulatedText'], (result) => {
    const newKeystrokeCount = (result.keystrokes || 0) + 1;
    let newAccumulatedText = result.accumulatedText || "";
    
    if (key === " ") {
      newAccumulatedText += " ";
    } else if (key.length === 1) {
      newAccumulatedText += key;
    }
    
    chrome.storage.local.set({
      keystrokes: newKeystrokeCount,
      accumulatedText: newAccumulatedText
    });
    
    console.log('Keystrokes:', newKeystrokeCount);
    console.log('accumulatedText:', newAccumulatedText);
  });

  handleActivity();
}

function handleActivity() {
  if (!isLogging) return;
  chrome.runtime.sendMessage({action: 'updateActivity'}).catch(() => {
    stopLogging();
  });
}

function updateLastActivity() {
  if (!isLogging) return;
  chrome.storage.local.set({lastActivityTime: Date.now()});
}

function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mouseClicks', 'keystrokes', 'idleTime', 'accumulatedText'], (result) => {
      resolve({
        mouseClicks: result.mouseClicks || 0,
        keystrokes: result.keystrokes || 0,
        idleTime: result.idleTime || 0,
        accumulatedText: result.accumulatedText || ""
      });
    });
  });
}

console.log('Content Script: Initialized and ready to log');

chrome.storage.local.get(['isLogging'], (result) => {
  if (result.isLogging) {
    startLogging();
  }
});