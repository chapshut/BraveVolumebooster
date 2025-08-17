class AudioAmplifier {
    constructor() {
        this.audioContext = null;
        this.compressor = null;
        this.gainNode = null;
        this.analyser = null;
        this.inputAnalyser = null;
        this.audioElements = new Map();
        this.settings = {
            volume: 100,
            compressionEnabled: false,
            threshold: -24,
            ratio: 4,
            attack: 0.05,
            release: 0.25
        };
        this.audioLevels = {
            inputLevel: 0,
            outputLevel: 0
        };
        
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.observeAudioElements();
        this.startAudioLevelMonitoring();
        
        // Initial scan for existing audio/video elements
        this.scanForAudioElements();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'updateAudioSettings':
                    this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;
                    
                case 'getAudioStatus':
                    sendResponse({ 
                        hasAudio: this.audioElements.size > 0,
                        audioContext: this.audioContext !== null
                    });
                    break;
                    
                case 'getAudioLevels':
                    sendResponse(this.audioLevels);
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
            return true;
        });
    }

    async createAudioContext() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create audio processing nodes
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.gainNode = this.audioContext.createGain();
            this.analyser = this.audioContext.createAnalyser();
            this.inputAnalyser = this.audioContext.createAnalyser();
            
            // Configure analyser nodes
            this.analyser.fftSize = 256;
            this.inputAnalyser.fftSize = 256;
            
            // Set initial compressor settings
            this.updateCompressorSettings();
            this.updateGainSettings();
            
            // Connect nodes: input → inputAnalyser → compressor → gain → analyser → destination
            this.inputAnalyser.connect(this.compressor);
            this.compressor.connect(this.gainNode);
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            console.log('Audio context and processing chain created');
            
            // Add user interaction handlers to resume audio context
            this.addUserInteractionHandlers();
        } catch (error) {
            console.error('Error creating audio context:', error);
        }
    }

    addUserInteractionHandlers() {
        const resumeAudioContext = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    console.log('AudioContext resumed after user interaction');
                } catch (error) {
                    console.error('Error resuming audio context:', error);
                }
            }
        };

        // Add event listeners for common user interactions
        const events = ['click', 'keydown', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resumeAudioContext, { once: true, passive: true });
        });
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.audioContext) {
            this.updateGainSettings();
            this.updateCompressorSettings();
        }
    }

    updateGainSettings() {
        if (this.gainNode) {
            const gainValue = this.settings.volume / 100;
            this.gainNode.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
        }
    }

    updateCompressorSettings() {
        if (this.compressor) {
            this.compressor.threshold.setValueAtTime(
                this.settings.threshold, 
                this.audioContext.currentTime
            );
            this.compressor.ratio.setValueAtTime(
                this.settings.ratio, 
                this.audioContext.currentTime
            );
            this.compressor.attack.setValueAtTime(
                this.settings.attack, 
                this.audioContext.currentTime
            );
            this.compressor.release.setValueAtTime(
                this.settings.release, 
                this.audioContext.currentTime
            );
            
            // Enable/disable compression by routing
            if (this.settings.compressionEnabled) {
                // Already connected in the chain
            } else {
                // Bypass compressor by setting very high threshold and low ratio
                this.compressor.threshold.setValueAtTime(0, this.audioContext.currentTime);
                this.compressor.ratio.setValueAtTime(1, this.audioContext.currentTime);
            }
        }
    }

    async processAudioElement(element) {
        if (this.audioElements.has(element)) {
            return;
        }

        try {
            await this.createAudioContext();

            // Create media element source
            const source = this.audioContext.createMediaElementSource(element);
            
            // Connect to our processing chain
            source.connect(this.inputAnalyser);
            
            // Store reference
            this.audioElements.set(element, {
                source: source,
                element: element
            });
            
            console.log('Audio element processed:', element.tagName, element.src || element.currentSrc);
            
            // Add event listeners for cleanup and audio context management
            element.addEventListener('ended', () => this.cleanupAudioElement(element));
            element.addEventListener('pause', () => this.handleAudioPause(element));
            element.addEventListener('play', () => this.handleAudioPlay(element));
            
        } catch (error) {
            console.error('Error processing audio element:', error);
            // Retry processing after a user interaction
            this.scheduleRetryAfterUserInteraction(element);
        }
    }

    scheduleRetryAfterUserInteraction(element) {
        const retryProcessing = () => {
            this.processAudioElement(element);
        };

        const events = ['click', 'keydown', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, retryProcessing, { once: true, passive: true });
        });
    }

    cleanupAudioElement(element) {
        const audioData = this.audioElements.get(element);
        if (audioData) {
            try {
                audioData.source.disconnect();
            } catch (error) {
                console.error('Error disconnecting audio source:', error);
            }
            this.audioElements.delete(element);
        }
    }

    handleAudioPause(element) {
        // Audio paused, could implement specific handling if needed
    }

    async handleAudioPlay(element) {
        // Resume audio context when audio starts playing
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.error('Error resuming audio context:', error);
            }
        }
    }

    scanForAudioElements() {
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
            this.processAudioElement(element);
        });
    }

    observeAudioElements() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is an audio/video element
                        if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                            this.processAudioElement(node);
                        }
                        
                        // Check for audio/video elements within the added node
                        const audioElements = node.querySelectorAll?.('audio, video') || [];
                        audioElements.forEach(element => {
                            this.processAudioElement(element);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also observe attribute changes for src updates
        const srcObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'src' || mutation.attributeName === 'currentSrc')) {
                    const element = mutation.target;
                    if (element.tagName === 'AUDIO' || element.tagName === 'VIDEO') {
                        // Reprocess element with new source
                        this.cleanupAudioElement(element);
                        setTimeout(() => this.processAudioElement(element), 100);
                    }
                }
            });
        });

        srcObserver.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['src', 'currentSrc']
        });
    }

    startAudioLevelMonitoring() {
        const updateLevels = () => {
            if (this.analyser && this.inputAnalyser) {
                // Get input levels
                const inputBufferLength = this.inputAnalyser.frequencyBinCount;
                const inputDataArray = new Uint8Array(inputBufferLength);
                this.inputAnalyser.getByteFrequencyData(inputDataArray);
                
                // Get output levels
                const outputBufferLength = this.analyser.frequencyBinCount;
                const outputDataArray = new Uint8Array(outputBufferLength);
                this.analyser.getByteFrequencyData(outputDataArray);
                
                // Calculate RMS levels
                let inputSum = 0;
                let outputSum = 0;
                
                for (let i = 0; i < inputBufferLength; i++) {
                    inputSum += inputDataArray[i] * inputDataArray[i];
                }
                
                for (let i = 0; i < outputBufferLength; i++) {
                    outputSum += outputDataArray[i] * outputDataArray[i];
                }
                
                this.audioLevels.inputLevel = Math.sqrt(inputSum / inputBufferLength) / 255;
                this.audioLevels.outputLevel = Math.sqrt(outputSum / outputBufferLength) / 255;
            } else {
                this.audioLevels.inputLevel = 0;
                this.audioLevels.outputLevel = 0;
            }
            
            requestAnimationFrame(updateLevels);
        };
        
        updateLevels();
    }
}

// Initialize when content script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AudioAmplifier();
    });
} else {
    new AudioAmplifier();
}

// Handle page navigation in SPAs
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Reinitialize for new page
        setTimeout(() => {
            if (window.audioAmplifier) {
                window.audioAmplifier.scanForAudioElements();
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });
