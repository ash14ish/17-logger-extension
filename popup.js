// Sample user credentials
const VALID_USERS = [
  { mobile: '9999999999', password: '123456', name: 'John', color: '#4f46e5' },
  { mobile: '8888888888', password: '123456', name: 'Alice', color: '#059669' },
  { mobile: '7777777777', password: '123456', name: 'Bob', color: '#dc2626' },
  { mobile: '6666666666', password: '123456', name: 'Emma', color: '#7c3aed' }
];

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const mainContainer = document.getElementById('mainContainer');
  const mobileInput = document.getElementById('mobile');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const eyeIcon = passwordToggle.querySelector('.eye-icon');
  const mobileError = document.getElementById('mobileError');
  const passwordError = document.getElementById('passwordError');
  const userBadge = document.getElementById('userBadge');
  const logoutModal = document.getElementById('logoutModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout = document.getElementById('confirmLogout');
  
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  
  const clickCount = document.getElementById('clickCount');
  const keyCount = document.getElementById('keyCount');
  const idleTime = document.getElementById('idleTime');
  const logDisplayContent = document.getElementById('logDisplayContent');

  // Screenshot
  let captureInterval = 0.5;
  const invervalValue = document.getElementById('intervalValue');

  // ----------------------------------- INITIALISER -------------------------------------

  function init(){
    invervalValue.textContent = `${captureInterval} minute${captureInterval <=1 ? "" : "s"}`;
  }

  // -------------------------- Check logging state --------------------------------------
  
  function checkLoggingState() {
    init();

    chrome.storage.local.get(['isLogging'], (result) => {
      if (result.isLogging) {
        startButton.disabled = true;
        startButton.classList.add("btn_disabled");
        stopButton.disabled = false;
        stopButton.classList.remove("btn_disabled");
        
        updateStats(); // Get initial stats
      } 
      else {
        idleTime.textContent = '0';
        chrome.storage.local.set({idleTime: 0});
        startButton.disabled = false;
        startButton.classList.remove("btn_disabled");
        stopButton.disabled = true;
        stopButton.classList.add("btn_disabled");
      }
    });
  }

  // ----------------------------- Stats update handler ---------------------------------------

  function updateStats() {
    chrome.storage.local.get(['mouseClicks', 'keystrokes', 'idleTime', 'accumulatedText'], (result) => {
      clickCount.textContent = +result.mouseClicks >= 10000 ? `10,000+` : result.mouseClicks;
      keyCount.textContent = +result.keystrokes >= 10000 ? `10,000+` : result.keystrokes;
      idleTime.textContent = +result.idleTime >= 10000 ? `10,000+` : result.idleTime;
      logDisplayContent.textContent = result.accumulatedText;
    });
  }

  // ----------------------- Start logging button click handler ---------------------------------

  function sendMessageToTabs(action) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        try {
          chrome.tabs.sendMessage(tab.id, { action });
        } catch (error) {
          console.warn("Message not received in tab:", tab.id, error);
        }
      });
    });
  }

  startButton.addEventListener('click', () => {
    chrome.storage.local.set({
      isLogging: true,
      mouseClicks: 0,
      keystrokes: 0,
      idleTime: 0,
      accumulatedText: ""
    }, () => {
      sendMessageToTabs("startLogging");
      
      startButton.disabled = true;
      startButton.classList.add("btn_disabled");
      stopButton.disabled = false;
      stopButton.classList.remove("btn_disabled");

      updateStats();
  
      // starting screenshots
      chrome.runtime.sendMessage({action: 'startScreenshots', interval: captureInterval});
    });
  });
  
  // ----------------------- Stop logging button click handler ---------------------------------

  function stopLoggingHandler() {
    chrome.storage.local.set({isLogging: false}, () => {
      sendMessageToTabs("stopLogging");
  
      startButton.disabled = false;
      startButton.classList.remove("btn_disabled");
      stopButton.disabled = true;
      stopButton.classList.add("btn_disabled");
  
      updateStats();
  
      // stopping screenshots
      chrome.runtime.sendMessage({action: 'stopScreenshots'});
    });
  }

  stopButton.addEventListener('click', stopLoggingHandler);
  
  // ------------------------------------ Check if user is already logged in ----------------------

  chrome.storage.local.get(['loggedInUser'], (result) => {
    if (result.loggedInUser) {
      showMainInterface(result.loggedInUser);
      checkLoggingState();
    } else {
      loginContainer.style.display = 'block';
      mainContainer.style.display = 'none';
    }
  });

  // ---------------------------------------- Input validation ---------------------------------

  mobileInput.addEventListener('input', () => {
    mobileInput.value = mobileInput.value.replace(/\D/g, '').slice(0, 10);
    mobileError.style.display = 'none';
    mobileInput.classList.remove('invalid');
  });

  passwordInput.addEventListener('input', () => {
    passwordError.style.display = 'none';
    passwordInput.classList.remove('invalid');
  });

  // ---------------------------------- Password visibility toggle ------------------------------

  passwordToggle.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    if (type === 'password') {
      eyeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      `;
    } else {
      eyeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      `;
    }
  });

  // ------------------------------------------- Login handler --------------------------------

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const mobile = mobileInput.value;
    const password = passwordInput.value;
    let isValid = true;

    mobileError.style.display = 'none';
    passwordError.style.display = 'none';
    mobileInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');

    if (mobile.length !== 10) {
      mobileError.style.display = 'block';
      mobileInput.classList.add('invalid');
      isValid = false;
    }

    if (password.length === 0) {
      passwordError.textContent = 'Please enter a password';
      passwordError.style.display = 'block';
      passwordInput.classList.add('invalid');
      isValid = false;
    }

    if (!isValid) return;

    const user = VALID_USERS.find(u => u.mobile === mobile);
    
    if (!user || user.password !== password) {
      passwordError.textContent = 'Invalid mobile number or password';
      passwordError.style.display = 'block';
      mobileInput.classList.add('invalid');
      passwordInput.classList.add('invalid');
      return;
    }

    init();

    chrome.storage.local.set({ loggedInUser: user }, () => {
      showMainInterface(user);

      mobileInput.classList.remove('invalid');
      passwordInput.classList.remove('invalid');
      loginForm.reset();
      clickCount.textContent = keyCount.textContent = idleTime.textContent = 0;
    });
  });
  
  // ------------------------------------ Logout handler --------------------------------

  userBadge.addEventListener('click', () => {
    logoutModal.style.display = 'block';
  });

  cancelLogout.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });

  confirmLogout.addEventListener('click', () => { 
    stopLoggingHandler();
    
    chrome.storage.local.remove('loggedInUser', () => {
      logoutModal.style.display = 'none';
      loginContainer.style.display = 'block';
      mainContainer.style.display = 'none';
      mobileInput.value = '';
      passwordInput.value = '';
    });
  });

  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.style.display = 'none';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutModal.style.display === 'block') {
      logoutModal.style.display = 'none';
    }
  });

  function showMainInterface(user) {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'block';
    userBadge.style.backgroundColor = user.color;
    userBadge.textContent = user.name[0].toUpperCase();
    userBadge.title = `Logged in as ${user.name}\nClick to logout`;
  }

  // ---------------------------------- Existing logging functionality --------------------------------

  if (startButton && stopButton) {
    startButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'startLogging' });
    });

    stopButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stopLogging' });
    });
  }
});