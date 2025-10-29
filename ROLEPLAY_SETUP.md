# Role-Play Practice Setup Guide

The Role-Play Practice feature allows you to simulate sales calls with AI-powered prospects using Google's Gemini Live Audio API.

## Current Status

⚠️ **The Role-Play feature requires a valid Google Gemini API key to function.**

## Setup Instructions

### 1. Get a Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your new API key

### 2. Add the API Key to Your Environment

1. Open the `.env` file in the project root
2. Replace the placeholder with your actual API key:

```
VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

3. Save the file and restart your development server

### 3. Verify Browser Permissions

The Role-Play feature requires microphone access:

1. When you start a session, your browser will prompt for microphone permission
2. Click "Allow" to grant access
3. If you previously denied permission, you'll need to update your browser settings

## How It Works

### Features

- **Live Audio Conversation**: Real-time voice interaction with an AI prospect
- **Role-Specific Behavior**: The AI adapts its personality based on the contact's job title
  - C-level executives: Strategic and visionary
  - Directors: Focused on team impact and ROI
  - Managers: Tactical and process-oriented

- **Realistic Objections**: The AI raises common sales objections:
  - Budget constraints
  - Competitive alternatives
  - Decision-making authority
  - Timing concerns

- **Live Transcription**: See both sides of the conversation in real-time
- **Post-Call Analysis**: AI-generated feedback on your performance after each session

### Using the Feature

1. **Navigate to Pipeline**: Add leads to your CRM
2. **Select a Lead**: Click "Practice" on any lead
3. **Start Session**: Click the green microphone button
4. **Have the Conversation**: The AI will introduce itself as the contact
5. **End Session**: Click the red stop button when done
6. **Review Feedback**: Read the AI-generated analysis of your performance

### Technical Details

**Model Used**: `gemini-2.5-flash-native-audio-preview-09-2025`
- This is an experimental preview model with native audio capabilities
- Supports bidirectional audio streaming
- Includes real-time transcription

**Audio Specifications**:
- Input: 16kHz PCM audio from your microphone
- Output: 24kHz audio streamed from Gemini
- Latency: Near real-time (typically <1 second)

## Troubleshooting

### "API key is not configured" Error

**Solution**: Follow the setup instructions above to add your Google Gemini API key to the `.env` file.

### Microphone Not Working

**Possible Causes**:
1. Browser permission denied
   - **Fix**: Check browser settings → Privacy & Security → Microphone

2. Microphone already in use
   - **Fix**: Close other applications using your microphone

3. No microphone detected
   - **Fix**: Ensure a microphone is connected and selected in system settings

### "Session Error" or Connection Issues

**Possible Causes**:
1. Invalid API key
   - **Fix**: Verify your API key is correct in the `.env` file

2. API quota exceeded
   - **Fix**: Check your Google AI Studio quota limits

3. Network connectivity
   - **Fix**: Check your internet connection

### Audio Not Playing

**Possible Causes**:
1. Browser audio permissions
   - **Fix**: Ensure site can play audio in browser settings

2. System volume muted
   - **Fix**: Check system and browser volume levels

3. Audio output device issues
   - **Fix**: Verify correct audio output device is selected

### Transcription Not Appearing

This can happen if:
- The audio is too quiet
- Background noise is high
- Speech is unclear

**Fix**: Speak clearly and ensure good microphone quality.

## Best Practices

### For Best Results

1. **Use a Quality Microphone**: Built-in laptop mics work, but external USB mics are better
2. **Quiet Environment**: Minimize background noise
3. **Speak Clearly**: Articulate words for better transcription
4. **Pace Yourself**: Don't rush - natural conversation works best
5. **Listen Carefully**: The AI will give you realistic objections to handle

### Practice Tips

1. **Prepare Your Pitch**: Review the product information before starting
2. **Handle Objections**: The AI will challenge you - practice your responses
3. **Ask Discovery Questions**: Qualify the prospect like a real call
4. **Close Confidently**: Practice asking for the next step
5. **Review Feedback**: Use the post-call analysis to improve

## Cost Considerations

- Google Gemini API usage is billed per audio minute
- Preview models may have different pricing
- Check [Google's pricing page](https://ai.google.dev/pricing) for current rates
- Monitor your usage in Google AI Studio

## API Limits

**Free Tier** (as of latest information):
- 15 requests per minute
- 1,500 requests per day
- May change - check Google AI Studio for current limits

**Paid Tier**:
- Higher rate limits
- Pay-as-you-go pricing
- Enterprise options available

## Privacy & Security

- Audio is processed by Google's Gemini API
- Conversations are not stored permanently by this application
- Transcripts are temporarily stored in your browser session
- Review [Google's Privacy Policy](https://policies.google.com/privacy) for details

## Future Enhancements

Planned improvements:
- [ ] Persistent session history
- [ ] Custom prospect personas
- [ ] Objection libraries
- [ ] Performance analytics over time
- [ ] Team coaching features
- [ ] Call recording and playback

## Support

If you encounter issues:

1. Check this guide first
2. Verify your API key is valid
3. Review browser console for error messages
4. Check microphone permissions
5. Restart the browser if needed

## Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Live API Reference](https://ai.google.dev/api/live)
- [Audio Streaming Guide](https://ai.google.dev/api/live/audio)

## Model Availability

**Note**: The `gemini-2.5-flash-native-audio-preview-09-2025` model is in preview/experimental status. If it becomes unavailable, the application will need to be updated to use the stable version when it's released.

Check [Google's model list](https://ai.google.dev/models) for the latest available models.
