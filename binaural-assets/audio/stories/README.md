# Sleep Story Narration Scripts - Quick Reference

## 🎙 Recording Checklist

### Kids Stories (Moshi-Style)
- [ ] **The Sleepy Cloud Ship** (10 min) - Ages 4-8
- [ ] **The Friendly Dragon's Lullaby** (12 min) - Ages 5-10  
- [ ] **The Starlight Express Train** (15 min) - Ages 6-12

### Adult Stories (Meditation/Mindfulness)
- [ ] **The Ancient Forest Path** (15 min) - Mindful walking
- [ ] **Ocean of Consciousness** (20 min) - Deep meditation
- [ ] **Mountain Temple at Twilight** (18 min) - Zen contemplation

## 📝 Recording Instructions

1. **Voice**: Warm, calm, 30-40% slower than normal speech
2. **Pauses**: 3-5 seconds between major sections
3. **Volume**: Consistent, gentle, slightly quieter toward end
4. **Format**: WAV or OGG, 48kHz, 24-bit
5. **Location**: Save to `/public/binaural-assets/audio/stories/`
6. **Naming**: Use story ID (e.g., `story-sleepy-cloud-ship.ogg`)

## 🎵 Recommended Audio Settings
- Gentle compression (-2dB reduction max)
- Warm EQ boost (200-400Hz)
- High-cut filter above 10kHz
- Minimal room reverb
- Clean, quiet recording environment

## 📚 Full Scripts
See `NARRATION_SCRIPTS.md` for complete narration text.

## 🔊 Once Recorded
1. Place audio file in `/public/binaural-assets/audio/stories/`
2. Update `stories.js` - set `audioUrl: 'audio/stories/[filename].ogg'`
3. Test in app by clicking story card
4. Verify frequency + soundscape layers work correctly
