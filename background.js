class AudioAmplifierBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupInstallHandler();
        this.setupTabHandlers();
        this.setupMessageHandlers();
    }

    setupInstallHandler() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                console.log('Audio Amplifier extension installed');
                this.showWelcomeNotification();
            } else if (details.reason === 'update') {
                console.log('Audio Amplifier extension updated');
            }
        });
    }

    setupTabHandlers() {
        // Clean up settings when tabs are closed
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.cleanupTabSettings(tabId);
        });

        // Handle tab updates (e.g., navigation)
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                // Inject content script if needed
                this.ensureContentScriptInjected(tabId, tab.url);
            }
        });
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'getTabId':
                    sendResponse({ tabId: sender.tab?.id });
                    break;
                    
                case 'logError':
                    console.error('Content script error:', message.error);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
            return true;
        });
    }

    async cleanupTabSettings(tabId) {
        try {
            // Remove settings for closed tab
            await chrome.storage.local.remove([`audioSettings_${tabId}`]);
            console.log(`Cleaned up settings for tab ${tabId}`);
        } catch (error) {
            console.error('Error cleaning up tab settings:', error);
        }
    }

    async ensureContentScriptInjected(tabId, url) {
        // Skip non-web pages
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return;
        }

        try {
            // Test if content script is already injected
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        } catch (error) {
            // Content script not injected, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                console.log(`Content script injected into tab ${tabId}`);
            } catch (injectionError) {
                console.error('Error injecting content script:', injectionError);
            }
        }
    }

    showWelcomeNotification() {
        // Could implement a welcome notification here
        console.log('Welcome to Audio Amplifier & Compressor!');
    }
}

// Initialize background script
new AudioAmplifierBackground();
