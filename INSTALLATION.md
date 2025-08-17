# Audio Amplifier & Compressor Extension Installation

## Quick Installation Guide

### 1. Download Extension Files
Download all the extension files to a folder on your computer:
- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.js`
- `popup.css`
- `icons/` folder with all SVG files

### 2. Enable Developer Mode in Brave
1. Open Brave browser
2. Click the three-line menu (☰) in the top-right corner
3. Go to **Settings**
4. Click **Extensions** in the left sidebar
5. Toggle **Developer mode** ON (top-right corner)

### 3. Install the Extension
1. Click **Load unpacked** button
2. Select the folder containing all the extension files
3. The extension should now appear in your extensions list

### 4. Test the Extension
1. Visit the test page at `http://localhost:5000/test.html`
2. Click the extension icon in your toolbar
3. Play any audio or video on the page
4. Adjust volume and compression settings in the extension popup

## Features

### Volume Amplification
- Boost audio volume from 100% to 500%
- Real-time volume adjustment
- Works with all HTML5 audio/video elements

### Dynamic Compression
- Professional audio compression with configurable parameters:
  - **Threshold**: -100 dB to 0 dB (controls when compression starts)
  - **Ratio**: 1:1 to 20:1 (how much compression is applied)
  - **Attack**: 0-1 seconds (how quickly compression engages)
  - **Release**: 0-1 seconds (how quickly compression disengages)

### Real-time Monitoring
- Input and output audio level meters
- Visual feedback for audio processing
- Status indicator shows when extension is actively processing audio

### Smart Audio Detection
- Automatically detects all audio and video elements
- Works with dynamically added audio content
- Handles single-page applications and content changes

## Usage Tips

1. **Start with low volume increases** - Even 150% can be quite loud
2. **Use compression for consistent audio** - Enable compression to balance loud and quiet parts
3. **Lower threshold = more compression** - Try -40 dB threshold for speech, -24 dB for music
4. **Higher ratios compress more** - 4:1 is good for most content, 8:1+ for heavy compression
5. **Quick attack/release for fast response** - Slower settings sound more natural

## Troubleshooting

### Extension not working?
- Make sure you're on a website with audio/video content
- Click anywhere on the page first (required for audio processing)
- Check that the extension icon shows as active

### No audio processing?
- Verify the extension has permission to access the current website
- Try refreshing the page after installing the extension
- Make sure audio is actually playing on the page

### Settings not saving?
- Each tab remembers its own settings
- Settings are automatically saved when you change them
- Use the "Reset to Default" button to restore original settings

## Technical Notes

This extension uses the Web Audio API to process audio in real-time. It creates an audio processing chain that intercepts audio from HTML5 media elements and applies amplification and compression before sending the audio to your speakers.

The extension is compatible with:
- YouTube and video streaming sites
- Music streaming services
- Podcasts and audio content
- Any website with HTML5 audio/video elements