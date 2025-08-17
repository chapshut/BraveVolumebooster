class AudioAmplifierPopup {
    constructor() {
        this.settings = {
            volume: 100,
            compressionEnabled: false,
            threshold: -24,
            ratio: 4,
            attack: 0.05,
            release: 0.25
        };
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
        this.checkAudioStatus();
        
        // Start audio level monitoring
        this.startAudioLevelMonitoring();
    }

    initializeElements() {
        this.elements = {
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            enableCompression: document.getElementById('enableCompression'),
            compressionControls: document.getElementById('compressionControls'),
            thresholdSlider: document.getElementById('thresholdSlider'),
            thresholdValue: document.getElementById('thresholdValue'),
            ratioSlider: document.getElementById('ratioSlider'),
            ratioValue: document.getElementById('ratioValue'),
            attackSlider: document.getElementById('attackSlider'),
            attackValue: document.getElementById('attackValue'),
            releaseSlider: document.getElementById('releaseSlider'),
            releaseValue: document.getElementById('releaseValue'),
            inputMeter: document.getElementById('inputMeter'),
            outputMeter: document.getElementById('outputMeter'),
            resetButton: document.getElementById('resetButton')
        };
    }

    bindEvents() {
        // Volume controls
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.settings.volume = parseInt(e.target.value);
            this.updateVolumeDisplay();
            this.saveSettings();
            this.sendSettingsToContent();
        });

        // Compression toggle
        this.elements.enableCompression.addEventListener('change', (e) => {
            this.settings.compressionEnabled = e.target.checked;
            this.updateCompressionControls();
            this.saveSettings();
            this.sendSettingsToContent();
        });

        // Compression controls
        this.elements.thresholdSlider.addEventListener('input', (e) => {
            this.settings.threshold = parseFloat(e.target.value);
            this.updateThresholdDisplay();
            this.saveSettings();
            this.sendSettingsToContent();
        });

        this.elements.ratioSlider.addEventListener('input', (e) => {
            this.settings.ratio = parseFloat(e.target.value);
            this.updateRatioDisplay();
            this.saveSettings();
            this.sendSettingsToContent();
        });

        this.elements.attackSlider.addEventListener('input', (e) => {
            this.settings.attack = parseFloat(e.target.value);
            this.updateAttackDisplay();
            this.saveSettings();
            this.sendSettingsToContent();
        });

        this.elements.releaseSlider.addEventListener('input', (e) => {
            this.settings.release = parseFloat(e.target.value);
            this.updateReleaseDisplay();
            this.saveSettings();
            this.sendSettingsToContent();
        });

        // Reset button
        this.elements.resetButton.addEventListener('click', () => {
            this.resetToDefaults();
        });
    }

    async loadSettings() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const result = await chrome.storage.local.get([`audioSettings_${tab.id}`]);
            const savedSettings = result[`audioSettings_${tab.id}`];
            
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.storage.local.set({
                [`audioSettings_${tab.id}`]: this.settings
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async sendSettingsToContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'updateAudioSettings',
                settings: this.settings
            });
        } catch (error) {
            console.error('Error sending settings to content script:', error);
        }
    }

    updateUI() {
        this.elements.volumeSlider.value = this.settings.volume;
        this.elements.enableCompression.checked = this.settings.compressionEnabled;
        this.elements.thresholdSlider.value = this.settings.threshold;
        this.elements.ratioSlider.value = this.settings.ratio;
        this.elements.attackSlider.value = this.settings.attack;
        this.elements.releaseSlider.value = this.settings.release;

        this.updateVolumeDisplay();
        this.updateCompressionControls();
        this.updateThresholdDisplay();
        this.updateRatioDisplay();
        this.updateAttackDisplay();
        this.updateReleaseDisplay();
    }

    updateVolumeDisplay() {
        this.elements.volumeValue.textContent = `${this.settings.volume}%`;
    }

    updateCompressionControls() {
        if (this.settings.compressionEnabled) {
            this.elements.compressionControls.classList.remove('disabled');
        } else {
            this.elements.compressionControls.classList.add('disabled');
        }
    }

    updateThresholdDisplay() {
        this.elements.thresholdValue.textContent = `${this.settings.threshold} dB`;
    }

    updateRatioDisplay() {
        this.elements.ratioValue.textContent = `${this.settings.ratio}:1`;
    }

    updateAttackDisplay() {
        this.elements.attackValue.textContent = `${this.settings.attack}s`;
    }

    updateReleaseDisplay() {
        this.elements.releaseValue.textContent = `${this.settings.release}s`;
    }

    async checkAudioStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getAudioStatus'
            });
            
            if (response && response.hasAudio) {
                this.elements.statusDot.classList.add('active');
                this.elements.statusText.textContent = 'Active';
            } else {
                this.elements.statusDot.classList.remove('active');
                this.elements.statusText.textContent = 'No Audio';
            }
        } catch (error) {
            this.elements.statusDot.classList.remove('active');
            this.elements.statusText.textContent = 'Inactive';
        }
    }

    startAudioLevelMonitoring() {
        setInterval(async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'getAudioLevels'
                });
                
                if (response) {
                    this.updateAudioMeters(response.inputLevel || 0, response.outputLevel || 0);
                }
            } catch (error) {
                // Silently handle errors for audio level monitoring
                this.updateAudioMeters(0, 0);
            }
        }, 100);
    }

    updateAudioMeters(inputLevel, outputLevel) {
        // Convert to percentage and invert for visual display
        const inputPercent = Math.max(0, Math.min(100, inputLevel * 100));
        const outputPercent = Math.max(0, Math.min(100, outputLevel * 100));
        
        // Update meter bar heights using CSS custom properties
        this.elements.inputMeter.style.setProperty('--level', `${100 - inputPercent}%`);
        this.elements.outputMeter.style.setProperty('--level', `${100 - outputPercent}%`);
        
        // Update the visual meter bars by manipulating the ::after pseudo-element through CSS variables
        const inputMeterBar = this.elements.inputMeter;
        const outputMeterBar = this.elements.outputMeter;
        
        if (inputMeterBar) {
            inputMeterBar.style.setProperty('--meter-height', `${inputPercent}%`);
        }
        
        if (outputMeterBar) {
            outputMeterBar.style.setProperty('--meter-height', `${outputPercent}%`);
        }
    }

    resetToDefaults() {
        this.settings = {
            volume: 100,
            compressionEnabled: false,
            threshold: -24,
            ratio: 4,
            attack: 0.05,
            release: 0.25
        };
        
        this.updateUI();
        this.saveSettings();
        this.sendSettingsToContent();
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioAmplifierPopup();
});
