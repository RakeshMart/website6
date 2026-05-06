// PWA Install Prompt Handler
let deferredPrompt = null;
let isAppInstalled = false;

// Check if app is already installed
window.addEventListener('load', () => {
  checkIfAppInstalled();
  registerServiceWorker();
});

// 1. REGISTER SERVICE WORKER
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', { scope: '/website/' })
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  }
}

// 2. CHECK IF APP IS ALREADY INSTALLED
function checkIfAppInstalled() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isAppInstalled = true;
    console.log('✅ App is running in standalone mode');
    hideInstallPrompt(); // Hide prompt if app already installed
    return;
  }

  // Also check using navigator.standalone (iOS)
  if (navigator.standalone === true) {
    isAppInstalled = true;
    hideInstallPrompt();
    return;
  }

  // Check if PWA was installed on Android
  if (localStorage.getItem('rakeshMartAppInstalled') === 'true') {
    isAppInstalled = true;
    hideInstallPrompt();
    return;
  }

  // Show install prompt if app NOT installed
  showInstallPrompt();
}

// 3. LISTEN FOR beforeinstallprompt EVENT
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent auto-install prompt
  e.preventDefault();
  
  // Save the deferred prompt for later
  deferredPrompt = e;
  
  console.log('📱 beforeinstallprompt event captured');
  
  // Show custom install button/notification
  if (!isAppInstalled) {
    showInstallPrompt();
  }
});

// 4. LISTEN FOR APP INSTALL SUCCESS
window.addEventListener('appinstalled', () => {
  console.log('✅ App installed successfully!');
  isAppInstalled = true;
  localStorage.setItem('rakeshMartAppInstalled', 'true');
  hideInstallPrompt();
  
  // Show success message
  showToast('🎉 App installed successfully! Enjoy shopping offline!', 'success');
});

// 5. LISTEN FOR DISPLAY MODE CHANGES
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  if (e.matches) {
    console.log('✅ App now in standalone mode');
    isAppInstalled = true;
    hideInstallPrompt();
  }
});

// 6. SHOW INSTALL PROMPT (Notification at top)
function showInstallPrompt() {
  // Create notification container if not exists
  let notif = document.getElementById('pwa-install-notif');
  if (notif) return; // Already showing

  const container = document.createElement('div');
  container.id = 'pwa-install-notif';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #1e5c2a, #2d7a3a);
    color: white;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(30, 92, 42, 0.3);
    font-family: 'Nunito', sans-serif;
    animation: slideDown 0.3s ease;
  `;

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
      <i class="fa fa-download" style="font-size: 1.1rem;"></i>
      <div>
        <div style="font-weight: 800; font-size: 0.95rem;">Rakesh Mart App</div>
        <div style="font-size: 0.8rem; opacity: 0.9;">Offline shopping karo • Faster access</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="pwa-install-btn" style="
        background: #ff6b2b;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 800;
        font-size: 0.8rem;
        cursor: pointer;
        font-family: 'Nunito', sans-serif;
        transition: all 0.2s;
        white-space: nowrap;
      ">
        <i class="fa fa-plus"></i> Install
      </button>
      <button id="pwa-close-btn" style="
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      ">
        <i class="fa fa-xmark"></i>
      </button>
    </div>

    <style>
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      #pwa-install-btn:hover {
        background: #e05520;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 107, 43, 0.4);
      }

      #pwa-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    </style>
  `;

  document.body.insertBefore(container, document.body.firstChild);

  // Add to body padding to avoid overlap
  const mainWrap = document.getElementById('main-wrap');
  if (mainWrap) {
    mainWrap.style.paddingTop = '75px';
  }

  // Install button handler
  document.getElementById('pwa-install-btn').addEventListener('click', handleInstallClick);

  // Close button handler
  document.getElementById('pwa-close-btn').addEventListener('click', hideInstallPrompt);
}

// 7. HANDLE INSTALL BUTTON CLICK
function handleInstallClick() {
  if (!deferredPrompt) {
    showToast('❌ Install not available. Try again later.', 'error');
    return;
  }

  // Show install prompt
  deferredPrompt.prompt();

  // Wait for user choice
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      isAppInstalled = true;
      localStorage.setItem('rakeshMartAppInstalled', 'true');
      hideInstallPrompt();
      showToast('🎉 App install ho rahi hai...', 'success');
    } else {
      console.log('❌ User dismissed the install prompt');
      hideInstallPrompt();
    }

    deferredPrompt = null;
  });
}

// 8. HIDE INSTALL PROMPT
function hideInstallPrompt() {
  const notif = document.getElementById('pwa-install-notif');
  if (notif) {
    notif.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => {
      notif.remove();
      
      // Remove padding from main content
      const mainWrap = document.getElementById('main-wrap');
      if (mainWrap) {
        mainWrap.style.paddingTop = '0';
      }
    }, 300);
  }
}

// Add slide-up animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }

  /* Adjust main wrap if notification is showing */
  #main-wrap {
    transition: padding-top 0.3s ease;
  }

  /* Ensure product cards don't overflow under notification */
  .products-grid {
    scroll-margin-top: 75px;
  }
`;
document.head.appendChild(style);

// 9. ADD INSTALL APP OPTION TO 3-DOT MENU (Optional - for users who dismissed)
function addMenuInstallOption() {
  const menuLinks = document.querySelector('.menu-links');
  if (!menuLinks || isAppInstalled || !deferredPrompt) return;

  const installLink = document.createElement('a');
  installLink.href = '#';
  installLink.className = 'menu-link';
  installLink.style.borderTop = '1px solid var(--border)';
  installLink.style.marginTop = '0.8rem';
  installLink.style.paddingTop = '1rem';
  installLink.innerHTML = '<i class="fa fa-download" style="color: var(--accent);"></i> Install App';
  installLink.addEventListener('click', (e) => {
    e.preventDefault();
    handleInstallClick();
    closeMenu();
  });

  menuLinks.appendChild(installLink);
}

// Wait for menu to load
setTimeout(addMenuInstallOption, 1000);

console.log('🚀 PWA Install Script Loaded');
