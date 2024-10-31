let screenshotInterval = 1;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startScreenshots') {
    startScreenshots(request.interval || 1);
    sendResponse({success: true});
  } else if (request.action === 'stopScreenshots') {
    stopScreenshots();
    sendResponse({success: true});
  }
  else if (request.action === 'updateActivity') {
    updateGlobalActivity();
    sendResponse({success: true});
  }
});

function updateGlobalActivity() {
  chrome.storage.local.set({
    lastActivityTime: Date.now(),
  });
  
  // Clear existing alarm and create new one
  chrome.alarms.clear('checkIdle', () => {
    chrome.alarms.create('checkIdle', {
      periodInMinutes: 1,
      delayInMinutes: 1
    });
  });
}

function startScreenshots(interval) {
  chrome.alarms.clear('takeScreenshot', () => {
    chrome.alarms.create('takeScreenshot', {
      periodInMinutes: interval,
      delayInMinutes: interval
    });
  });
}

function stopScreenshots() {
  chrome.alarms.clear('takeScreenshot');
}

function takeScreenshotForActiveTab() {
    const createDesktopCapturePopup = {
      url: "capture.html",
      type: "popup",
      width: 700,
      height: 650
    };
    chrome.windows.create(createDesktopCapturePopup);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkIdle') {
    chrome.storage.local.get(['lastActivityTime', 'idleTime', 'isLogging'], (result) => {
      if (!result.isLogging) {
        chrome.alarms.clear('checkIdle');
        return;
      }
      
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - (result.lastActivityTime || currentTime);
      
      if (timeSinceLastActivity >= 60000) { // 1 minute
        const newIdleTime = (result.idleTime || 0) + 1;
        chrome.storage.local.set({idleTime: newIdleTime}, () => {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              try {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'logIdleTime',
                  idleTime: newIdleTime
                });
              } catch (error) {
                console.warn("Failed to send idle time message to tab:", tab.id, error);
              }
            });
          });
        });
      }
    });
  } else if (alarm.name === 'takeScreenshot') {
    takeScreenshotForActiveTab();
  }
});

// Listen for tab updates to check logging state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, {action: 'checkLoggingState'});
  }
});
