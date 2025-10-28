import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import type { CrmLead, UserInput } from '../types';
import { getRolePlayFeedback } from '../services/perplexityService';
import { MicIcon, StopIcon } from './icons';

interface RolePlayProps {
  lead: CrmLead;
  userInput: UserInput | null;
}

// Audio helper functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const RolePlay: React.FC<RolePlayProps> = ({ lead, userInput }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcripts, setTranscripts] = useState<{ speaker: 'user' | 'ai', text: string }[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const nextStartTime = useRef(0);
  const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = useCallback(async (generateFeedback: boolean = false) => {
    if (!sessionRef.current && !isSessionActive) return;

    setIsSessionActive(false);
    setIsAiSpeaking(false);

    sessionRef.current?.close();
    sessionRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    
    audioContextRef.current?.close().catch(console.error);
    audioContextRef.current = null;
    
    outputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current = null;

    audioSources.current.forEach(source => source.stop());
    audioSources.current.clear();
    nextStartTime.current = 0;

    if (generateFeedback && transcripts.length > 0) {
      setIsGeneratingFeedback(true);
      setFeedback(null);
      const feedbackResult = await getRolePlayFeedback(transcripts, userInput, lead);
      setFeedback(feedbackResult);
      setIsGeneratingFeedback(false);
    }
  }, [isSessionActive, transcripts, userInput, lead]);

  const startSession = useCallback(async () => {
    if (isSessionActive || !lead) return;
    
    setTranscripts([]);
    setFeedback(null);
    setIsSessionActive(true);

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_PERPLEXITY_API_KEY });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContextRef.current.createGain();
    outputNode.connect(outputAudioContextRef.current.destination);

    const systemInstruction = `You are an AI Digital Twin of ${lead.contact.name}, the ${lead.contact.title} at ${lead.company}.
    You are role-playing a sales call. Behave like a real person with a personality inferred from their role: if they are a C-level executive, be strategic and visionary; if they are a director, be focused on team impact and ROI.
    The user is a salesperson trying to sell you a product called "${userInput?.productName || 'a new B2B solution'}" which promises to "${userInput?.valueProposition || 'deliver significant value'}".
    Your goal is to have a natural conversation. Ask relevant questions, raise realistic objections (e.g., "We have a tight budget," "How is this different from [competitor]?", "I'm not the right person for this."), and react based on the salesperson's pitch.
    Start the conversation by saying: "Hello, this is ${lead.contact.name}."`;

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: systemInstruction,
      },
      callbacks: {
        onopen: async () => {
          console.log('Live session opened.');
          try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob })).catch(console.error);
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
          } catch (error) {
            console.error("Microphone access error:", error);
            stopSession(false);
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            currentInputTranscription.current += message.serverContent.inputTranscription.text;
          }
          if (message.serverContent?.outputTranscription) {
             currentOutputTranscription.current += message.serverContent.outputTranscription.text;
          }

          if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current.trim()) {
                setTranscripts(prev => [...prev, { speaker: 'user', text: currentInputTranscription.current.trim() }]);
              }
              if (currentOutputTranscription.current.trim()) {
                setTranscripts(prev => [...prev, { speaker: 'ai', text: currentOutputTranscription.current.trim() }]);
              }
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
          }

          const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData && outputAudioContextRef.current) {
            setIsAiSpeaking(true);
            const outputCtx = outputAudioContextRef.current;
            nextStartTime.current = Math.max(nextStartTime.current, outputCtx.currentTime);
            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.addEventListener('ended', () => {
              audioSources.current.delete(source);
              if (audioSources.current.size === 0) setIsAiSpeaking(false);
            });
            source.start(nextStartTime.current);
            nextStartTime.current += audioBuffer.duration;
            audioSources.current.add(source);
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error("Live session error:", e);
          stopSession(false);
        },
        onclose: () => {
          console.log('Live session closed.');
          stopSession(false);
        },
      }
    });
    sessionRef.current = await sessionPromise;
  }, [isSessionActive, lead, userInput, stopSession]);
  
  useEffect(() => {
    return () => {
      stopSession(false);
    };
  }, [stopSession]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg p-6 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">AI Role-Play</h2>
        <p className="text-slate-600 mt-1">Practicing call with <span className="font-semibold">{lead.contact.name}</span> from <span className="font-semibold">{lead.company}</span></p>

        <div className="mt-6 h-96 overflow-y-auto bg-slate-50 p-4 rounded-md border space-y-4">
          {transcripts.length === 0 && (
             <div className="flex h-full items-center justify-center text-slate-500">
                <p>{feedback ? "Session ended. See feedback below." : "Press 'Start Session' to begin."}</p>
            </div>
          )}
          {transcripts.map((t, i) => (
            <div key={i} className={`flex flex-col ${t.speaker === 'user' ? 'items-end' : 'items-start'}`}>
              <span className={`text-xs font-bold mb-1 ${t.speaker === 'user' ? 'text-indigo-600' : 'text-slate-600'}`}>{t.speaker === 'user' ? 'You' : 'Prospect'}</span>
              <div className={`max-w-md rounded-lg px-4 py-2 ${t.speaker === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center space-x-4">
            {!isSessionActive ? (
              <button
                onClick={startSession}
                disabled={isGeneratingFeedback}
                className="flex items-center justify-center w-20 h-20 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-slate-400"
              >
                <MicIcon className="w-8 h-8" />
              </button>
            ) : (
              <button
                onClick={() => stopSession(true)}
                className="flex items-center justify-center w-20 h-20 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <StopIcon className="w-8 h-8" />
              </button>
            )}
          </div>
          <div className="mt-4 h-6">
            {isSessionActive && (
              <div className="flex items-center space-x-2">
                 <span className={`h-3 w-3 rounded-full ${isAiSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                 <span className="text-sm text-slate-500">{isAiSpeaking ? 'AI Speaking...' : 'Listening...'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {(isGeneratingFeedback || feedback) && (
        <div className="mt-8 bg-white shadow-lg rounded-lg p-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Post-Call Analysis</h3>
          {isGeneratingFeedback && (
            <div className="flex items-center justify-center p-8">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-4 text-slate-600">Generating your feedback report...</span>
            </div>
          )}
          {feedback && (
             <div className="prose prose-slate mt-4 max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: feedback.replace(/(\d\.)/g, '<br/>$1') }}></div>
          )}
        </div>
      )}
    </div>
  );
};