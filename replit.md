# Audio Amplifier & Compressor Chrome Extension

## Overview

This is a Chrome browser extension that provides audio amplification and dynamic compression capabilities for web audio content. The extension allows users to boost volume levels beyond the browser's default limits (up to 500%) and apply professional audio compression with configurable parameters like threshold, ratio, attack, and release times. It includes real-time audio level monitoring and a user-friendly popup interface for controlling audio settings across all web pages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Extension Architecture
The extension follows Chrome Extension Manifest V3 architecture with three main components:
- **Background Service Worker**: Handles extension lifecycle, tab management, and inter-component messaging
- **Content Script**: Injected into all web pages to process audio using Web Audio API
- **Popup Interface**: Provides user controls for audio settings and real-time monitoring

### Audio Processing Pipeline
The core audio processing uses the Web Audio API with a signal chain consisting of:
- **Audio Context**: Creates the audio processing environment
- **Gain Node**: Handles volume amplification up to 5x normal levels
- **Dynamic Range Compressor**: Applies configurable compression with threshold, ratio, attack, and release controls
- **Analyser Nodes**: Monitor input and output audio levels for visual feedback

### Data Flow
Audio settings flow from the popup interface through Chrome's messaging system to the content script, which applies changes to the Web Audio API nodes. The system maintains per-tab audio processing isolation while sharing global settings across all tabs.

### State Management
Settings are persisted using Chrome's storage API, with real-time synchronization between the popup interface and active audio processing. The extension tracks audio elements across page navigations and maintains consistent processing state.

## External Dependencies

### Chrome APIs
- **chrome.runtime**: Message passing between extension components and lifecycle management
- **chrome.tabs**: Tab management and content script injection
- **chrome.storage**: Persistent settings storage across browser sessions

### Web APIs
- **Web Audio API**: Core audio processing with AudioContext, GainNode, DynamicsCompressorNode, and AnalyserNode
- **DOM APIs**: Audio/video element detection and media source management
- **MutationObserver**: Dynamic audio element detection as content changes

### Browser Permissions
- **activeTab**: Access to current tab for audio processing
- **storage**: Settings persistence
- **host_permissions**: All URLs access for universal audio processing