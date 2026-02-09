# Dialog Modes: Auto vs Manual

## Overview
Boltalka supports two distinct interaction modes: **Auto** (automatic VAD) and **Manual** (push-to-talk).

## Auto Mode (VAD — Voice Activity Detection)

### How It Works
1. **Press Connect** → Microphone access granted
2. **Speak naturally** → Audio streamed to OpenAI in real-time
3. **System detects silence** → Server-side VAD triggers
4. **AI responds** → Voice output plays automatically
5. **Loop repeats** → Ready for next interaction

### When to Use
- Natural conversation without button pressing
- Quiet environments where microphone clearly detects speech boundaries
- Hands-free scenarios

### Configuration
In `app.js`, inside `connect()` → `session.update`:
```javascript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 500  // Silence window = end of speech
}
```

### Troubleshooting
- **AI not responding?** Increase `silence_duration_ms` to 750ms
- **Audio cutting off?** Increase `prefix_padding_ms` to buffer more audio
- **False detections?** Decrease `silence_duration_ms` or check microphone levels

## Manual Mode (Push-to-Talk)

### How It Works
1. **Select Manual from dropdown** → Manual mode activated
2. **Press Talk** → Button turns red showing `🔴 Recording...`
3. **Speak your phrase** → Audio buffered locally (not sent yet)
4. **Press Talk again** → Audio submitted, AI processes and responds
5. **Loop repeats** → Ready for next phrase

### When to Use
- Noisy environments (coffee shop, street)
- Precise control over when AI responds
- Medical/legal transcription requiring accuracy
- Testing/debugging API behavior

### Technical Implementation
Manual mode **disables** server-side VAD:
```javascript
// In Manual mode:
turn_detection: null  // No automatic speech detection
```

Instead, the client sends:
```javascript
sendEvent({ type: 'input_audio_buffer.commit' });    // Finalize buffer
setTimeout(() => {
  sendEvent({ type: 'response.create' });  // Request AI response
}, 150);
```

### Talk Button States
1. **IDLE** (grey): Waiting for first click
2. **RECORDING** (red): Audio being buffered, shows `🔴 Recording...`
3. **SENT**: Audio committed, response pending
4. Returns to IDLE after response complete

### Talk Button Validation
Button is **disabled** (grey) when:
- Dropdown is set to "Auto (VAD)" instead of Manual
- Microphone not connected
- WebRTC connection not established
- DataChannel not open

## Mode Switching (On-the-Fly)

### Zero Downtime Transitions
Switching modes does NOT disconnect WebRTC:

```javascript
// In dropdown handler
const newMode = this.value;  // "auto" or "manual"
vadMode = newMode;

// Update session WITHOUT reconnecting
const updateConfig = {
  type: 'session.update',
  session: {
    turn_detection: newMode === 'manual' ? null : { type: 'server_vad', ... }
  }
};

dc.send(JSON.stringify(updateConfig));
log(`Switched to ${newMode} mode`);
```

### When Switching
- **Auto → Manual**: turn_detection disabled, Talk button becomes active
- **Manual → Auto**: turn_detection enabled, Talk button becomes inactive
- **No audio loss** or connection disruption

## Troubleshooting

### Talk Button Disabled
- ✅ Ensure dropdown shows **Manual** (not Auto)
- ✅ Press **Connect** first
- ✅ Wait for connection status to show "Connected"
- ✅ Check Technical Event Log for errors

### VAD False Triggers (Auto Mode)
- Try Manual mode for more control
- Check microphone input levels in system settings
- Adjust `silence_duration_ms` (default 500ms)

### AI Not Responding
- Check Technical Event Log (emoji indicators)
- Verify OpenAI API key and quota
- Look for errors like `insufficient_quota`

## Event Logging

System logs all events with emoji indicators:
- `🔊 Speech detected` — Microphone detected audio
- `🔇 Speech stopped` — Silence detected
- `🎤 User (transcribed): ...` — What you said
- `📤 Response done` — AI ready to respond
- `🤖 AI (transcribed): ...` — AI's response
- `❌ ERROR: ...` — Connection or API errors

## For Developers

### Add Custom Mode
1. Edit `app.js` in `connect()` → `session.update`
2. Modify `sessionConfig` with new `turn_detection` parameters
3. Add condition to mode-switching handler

### Change AI Instructions
Edit `config.php`:
```php
'boltalka_instructions' => 'Your custom system prompt...',
```

This affects all connections (Auto and Manual modes).

