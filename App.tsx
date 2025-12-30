
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from './services/geminiService';
import { Explanation, Persona, ChatMessage } from './types';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';
import { 
  Search, 
  BookOpen, 
  History as HistoryIcon, 
  ChevronRight, 
  Loader2,
  Tractor,
  Coffee,
  Sparkles,
  Zap,
  Mic,
  MicOff,
  Camera,
  X,
  Trash2,
  Cpu as CpuIcon,
  CheckCircle2,
  ArrowRight,
  Utensils,
  Anchor,
  VolumeX,
  Waves,
  Headphones,
  MessageSquare,
  Send,
  Phone,
  PhoneOff,
  Activity,
  UserCheck,
  Languages,
  Sprout,
  Crown,
  GraduationCap,
  MessageCircleCode,
  AlertTriangle,
  RefreshCcw,
  Key
} from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const PERSONA_VOICE_MAP: Record<string, string> = {
  'pothu-tamil': 'Kore',
  'chennai': 'Puck',
  'kongu': 'Zephyr',
  'madurai': 'Fenrir',
  'jaffna': 'Charon'
};

const PERSONAS: Persona[] = [
  {
    id: 'pothu-tamil',
    name: 'Standard Tamil',
    tagline: 'பொதுத் தமிழ்',
    description: 'Universal academic Tamil. Perfect for students and professionals.',
    dialect: 'Standard Tamil',
    analogies: ['Post office', 'Railway station', 'Public library'],
    colloquialisms: ['வணக்கம்', 'குறிப்பாக', 'உதாரணத்திற்கு'],
    icon: 'Book',
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    accentColor: '#6366f1'
  },
  {
    id: 'chennai',
    name: 'Chennai Tamil',
    tagline: 'மெட்ராஸ் பாஷை',
    description: 'Fast, sharp, and street-smart. Straight from the heart of Madras.',
    dialect: 'Madras Bashai',
    analogies: ['MTC Bus', 'Marina Beach Crowd', 'Cinema Theater'],
    colloquialisms: ['நைனா', 'கஸ்மாலம்', 'கலாய்க்காத', 'பிகரு'],
    icon: 'Coffee',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    accentColor: '#f43f5e'
  },
  {
    id: 'kongu',
    name: 'Kongu Tamil',
    tagline: 'கொங்குத் தமிழ்',
    description: 'Polite, agricultural, and industrial tech logic from CBE/Erode.',
    dialect: 'Kongu Tamil',
    analogies: ['Cotton Mills', 'Coconut Groves', 'Gounder Veedu'],
    colloquialisms: ['ஏனுங்க', 'சொல்லுங்க', 'வாங்கப்பு', 'போங்கப்பு'],
    icon: 'Tractor',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    accentColor: '#10b981'
  },
  {
    id: 'madurai',
    name: 'Madurai Tamil',
    tagline: 'மதுரைத் தமிழ்',
    description: 'Royal, bold, and hospitable logic from the Pandiyan capital.',
    dialect: 'Madurai Tamil',
    analogies: ['Meenakshi Temple', 'Jigarthanda Shop', 'Jallikattu Arena'],
    colloquialisms: ['லே', 'அங்குட்டு', 'இங்குட்டு', 'சாவகாசமா'],
    icon: 'Utensils',
    color: 'amber',
    gradient: 'from-amber-400 to-orange-500',
    accentColor: '#fbbf24'
  },
  {
    id: 'jaffna',
    name: 'Eelam Tamil',
    tagline: 'ஈழத் தமிழ்',
    description: 'Pure, scholarly, and rhythmic. The ultimate classical vibe.',
    dialect: 'Jaffna Tamil',
    analogies: ['Palmyra Tree', 'Northern Sea', 'Village School'],
    colloquialisms: ['ஓம்', 'நீங்கள்', 'விளங்குதோ', 'பெடியன்'],
    icon: 'Anchor',
    color: 'cyan',
    gradient: 'from-cyan-400 to-blue-500',
    accentColor: '#22d3ee'
  }
];

const PersonaIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'Tractor': return <Tractor className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    case 'Book': return <BookOpen className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Anchor': return <Anchor className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const VoiceVisualizer: React.FC<{ active: boolean; color: string; analyser: AnalyserNode | null }> = ({ active, color, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current || !analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;
    const render = () => {
      animationId = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 14;
      const barGap = 3;
      const barWidth = (canvas.width - (barCount - 1) * barGap) / barCount;
      const centerY = canvas.height / 2;
      for (let i = 0; i < barCount; i++) {
        const val = dataArray[Math.floor((i / barCount) * (bufferLength / 2))] / 255;
        const barHeight = Math.max(4, val * canvas.height * 0.95);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(i * (barWidth + barGap), centerY - barHeight / 2, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [active, analyser, color]);
  if (!active) return <div className="w-[120px] h-[32px] flex items-center justify-center gap-1 opacity-10">{[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400" />)}</div>;
  return <canvas ref={canvasRef} width={120} height={32} className="rounded-lg opacity-80" />;
};

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

const App: React.FC = () => {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<Explanation | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [history, setHistory] = useState<Explanation[]>([]);
  const [activeTab, setActiveTab] = useState<'explain' | 'history'>('explain');
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [apiError, setApiError] = useState<{ type: 'quota' | 'key' | 'general', message: string } | null>(null);
  
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const livePlaybackContextRef = useRef<AudioContext | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) setHasApiKey(await window.aistudio.hasSelectedApiKey());
      else setHasApiKey(true);
    };
    checkKey();
    const saved = localStorage.getItem('lingua-history-v2');
    if (saved) setHistory(JSON.parse(saved));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTerm(transcript);
        handleExplain(transcript);
        setIsRecognizing(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecognizing(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecognizing(false);
      };
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lingua-history-v2', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamingText, liveTranscription]);

  const handleError = (e: any) => {
    const msg = e.message || "An unexpected error occurred.";
    if (msg.includes("quota") || msg.includes("429")) {
      setApiError({ type: 'quota', message: "Quota Exceeded: Your API key has hit its limit. You can wait a moment or switch to another key." });
    } else if (msg.includes("Requested entity was not found")) {
      setApiError({ type: 'key', message: "API Key Error: The selected project or key was not found." });
      setHasApiKey(false);
    } else {
      setApiError({ type: 'general', message: msg });
    }
  };

  const stopSpeaking = () => {
    activeSourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
    setIsSynthesizing(false);
  };

  const queueAudioChunk = async (textChunk: string) => {
    if (!textChunk.trim()) return;
    
    if (!playbackContextRef.current) {
      playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      playbackAnalyserRef.current = playbackContextRef.current.createAnalyser();
      playbackAnalyserRef.current.fftSize = 64;
    }
    
    const ctx = playbackContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const voiceName = PERSONA_VOICE_MAP[selectedPersona.id] || 'Kore';
    try {
      const base64Audio = await geminiService.speakExplanation(textChunk, selectedPersona, voiceName);
      
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackAnalyserRef.current!);
        playbackAnalyserRef.current!.connect(ctx.destination);
        
        setIsSpeaking(true);
        const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
        
        activeSourcesRef.current.add(source);
        source.onended = () => {
          activeSourcesRef.current.delete(source);
          if (activeSourcesRef.current.size === 0) {
             setIsSpeaking(false);
          }
        };
      }
    } catch (e) {
      handleError(e);
    }
  };

  const toggleVoiceSearch = () => {
    if (isRecognizing) {
      recognitionRef.current?.stop();
      setIsRecognizing(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecognizing(true);
      } catch (e) {
        console.error("Speech recognition already started or not supported");
      }
    }
  };

  const startLiveMentorship = async () => {
    if (isLiveMode) { stopLiveMentorship(); return; }
    
    stopSpeaking();
    setIsLiveMode(true);
    setLiveTranscription('Connecting with mentor...');
    setApiError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      livePlaybackContextRef.current = outputCtx;
      
      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 64;
      inputAnalyserRef.current = inputAnalyser;
      
      const outputAnalyser = outputCtx.createAnalyser();
      outputAnalyser.fftSize = 64;
      playbackAnalyserRef.current = outputAnalyser;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: PERSONA_VOICE_MAP[selectedPersona.id] || 'Zephyr' } }
          },
          systemInstruction: `You are the ${selectedPersona.name} Language Mentor. Engage in a natural, friendly, and helpful voice conversation in ${selectedPersona.dialect}. Talk with the specific rhythm, slang, and speed associated with someone from that region. Use local analogies like ${selectedPersona.analogies.join(', ')}. Keep it snappy, humorous, and encouraging. Your primary goal is to mentor the student in complex topics using the heart of the regional language.`,
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setLiveTranscription('Mentor connected. Please speak...');
            const source = inputCtx.createMediaStreamSource(stream);
            source.connect(inputAnalyser);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcm = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcm }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setLiveTranscription(prev => prev.length > 100 ? message.serverContent!.outputTranscription!.text : prev + ' ' + message.serverContent!.outputTranscription!.text);
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAnalyser);
              outputAnalyser.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              activeSourcesRef.current.add(source);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) setIsSpeaking(false);
              };
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            handleError(e);
            stopLiveMentorship();
          },
          onclose: () => stopLiveMentorship()
        }
      });
    } catch (err) {
      setIsLiveMode(false);
      alert("Microphone permission is required for Voice Mentorship.");
    }
  };

  const stopLiveMentorship = () => {
    setIsLiveMode(false);
    setIsSpeaking(false);
    setLiveTranscription('');
    if (audioContextRef.current) audioContextRef.current.close();
    if (livePlaybackContextRef.current) livePlaybackContextRef.current.close();
    nextStartTimeRef.current = 0;
  };

  const handleExplain = async (inputTerm: string) => {
    if (!inputTerm.trim()) return;
    setLoading(true);
    setStreamingText('');
    setCurrentExplanation(null);
    setApiError(null);
    stopSpeaking();
    
    let fullText = '';
    let lastSpokenIndex = 0;
    try {
      const stream = geminiService.explainTermStream(inputTerm, selectedPersona);
      for await (const chunk of stream) {
        if (chunk) {
          fullText += chunk;
          setStreamingText(fullText);
          
          if (autoSpeak) {
             const pendingText = fullText.slice(lastSpokenIndex);
             const sentenceMatch = pendingText.match(/[^.!?]+[.!?]+|\n\n/);
             if (sentenceMatch) {
                const sentence = sentenceMatch[0];
                queueAudioChunk(sentence);
                lastSpokenIndex += sentence.length;
             }
          }
        }
      }
      
      if (autoSpeak && lastSpokenIndex < fullText.length) {
         queueAudioChunk(fullText.slice(lastSpokenIndex));
      }

      const imageUrl = await geminiService.generateImage(inputTerm, selectedPersona);
      const newEntry: Explanation = {
        id: Date.now().toString(),
        term: inputTerm,
        tamilExplanation: fullText,
        imageUrl,
        timestamp: Date.now(),
        personaId: selectedPersona.id,
        chatHistory: []
      };
      setCurrentExplanation(newEntry);
      setHistory(prev => [newEntry, ...prev.slice(0, 49)]);
    } catch (e) {
      handleError(e);
      setStreamingText("மன்னிக்கவும், ஏதோ தவறு நடந்துவிட்டது.");
    } finally { setLoading(false); }
  };

  const resetKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setApiError(null);
    }
  };

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6 animate-scale-in">
          <CpuIcon className="w-16 h-16 text-indigo-500 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black tracking-tight text-slate-800">Connection Required</h2>
          <p className="text-slate-500">I need a Gemini API key to start mentoring you in your regional dialect. Please ensure you select a project with active billing.</p>
          <button onClick={resetKey} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 hover:shadow-indigo-300">Connect to AI Studio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-indigo-100">
      <div className="mesh-bg" style={{ 
        backgroundImage: `radial-gradient(circle at 20% 20%, ${selectedPersona.accentColor} 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${selectedPersona.accentColor}44 0%, transparent 50%)`
      }} />

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 transition-all duration-300">
        <div className="max-w-4xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('explain')}>
            <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${selectedPersona.gradient} text-white shadow-lg shadow-indigo-100 transition-all group-hover:scale-110 group-hover:rotate-6`}><MessageCircleCode className="w-6 h-6" /></div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight transition-colors">Language <span style={{ color: selectedPersona.accentColor }}>Mentor</span></h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{selectedPersona.name}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <button 
              onClick={startLiveMentorship}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${isLiveMode ? 'bg-slate-900 text-white shadow-2xl scale-105 animate-pulse-glow' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-300 hover:shadow-md'}`}
              style={isLiveMode ? { animation: 'pulse-glow 2s infinite' } : {}}
            >
              {isLiveMode ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              {isLiveMode ? 'End Session' : 'Voice Mentor'}
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 backdrop-blur-sm">
              <button onClick={() => setActiveTab('explain')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'explain' ? 'bg-white shadow-lg text-slate-900 scale-105' : 'text-slate-500 hover:text-slate-700'}`} style={activeTab === 'explain' ? { color: selectedPersona.accentColor } : {}}>Learn</button>
              <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'history' ? 'bg-white shadow-lg text-slate-900 scale-105' : 'text-slate-500 hover:text-slate-700'}`} style={activeTab === 'history' ? { color: selectedPersona.accentColor } : {}}>Vault</button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12 transition-all duration-500">
        {apiError && (
          <div className="animate-scale-in bg-rose-50 border-2 border-rose-200 p-6 rounded-[2rem] flex items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-rose-500 p-3 rounded-2xl text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-rose-900">Mentor Connection Problem</h4>
                <p className="text-rose-600 text-sm font-medium">{apiError.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={resetKey}
                className="px-6 py-3 bg-white border-2 border-rose-200 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
              >
                <Key className="w-4 h-4" /> Change Key
              </button>
              <button onClick={() => setApiError(null)} className="p-3 text-rose-400 hover:text-rose-600 transition-all"><X className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {activeTab === 'explain' ? (
          <>
            {isLiveMode ? (
              <div className="bg-white/90 backdrop-blur-xl rounded-[4rem] p-12 shadow-2xl border border-white space-y-10 text-center relative overflow-hidden animate-scale-in">
                <div className="relative z-10 space-y-8">
                  <div className="relative mx-auto w-40 h-40">
                    <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse`} style={{ backgroundColor: selectedPersona.accentColor }} />
                    <div className={`relative w-40 h-40 mx-auto rounded-full bg-gradient-to-br ${selectedPersona.gradient} flex items-center justify-center text-white shadow-2xl transform transition-transform duration-500 ${isSpeaking ? 'scale-110 rotate-3' : 'scale-100'}`}>
                      <PersonaIcon type={selectedPersona.icon} className={`w-20 h-20 ${isSpeaking ? 'animate-bounce' : 'floating'}`} />
                    </div>
                  </div>
                  
                  <div className="animate-fade-in-up">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">{selectedPersona.name}</h2>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: selectedPersona.accentColor }} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Regional Voice Active</p>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-4 py-4 animate-fade-in-up stagger-1">
                    <VoiceVisualizer active={true} color={selectedPersona.accentColor} analyser={playbackAnalyserRef.current} />
                  </div>

                  <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner min-h-[160px] flex items-center justify-center relative overflow-hidden animate-fade-in-up stagger-2">
                    <p className="tamil-font text-3xl text-slate-600 italic leading-relaxed px-6 transition-all duration-300">
                      {liveTranscription || 'Mentor is listening...'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4 animate-fade-in-up stagger-3">
                    <button 
                      onClick={stopLiveMentorship}
                      className="px-16 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95 group"
                    >
                      <span className="flex items-center gap-3">End Mentor Session <PhoneOff className="w-6 h-6 group-hover:rotate-12 transition-transform" /></span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <section className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Choose Your Regional Guide</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {PERSONAS.map((p, idx) => (
                      <button 
                        key={p.id} onClick={() => { setSelectedPersona(p); stopSpeaking(); }}
                        className={`persona-card animate-fade-in-up group relative p-4 rounded-3xl border-2 transition-all text-left overflow-hidden ${selectedPersona.id === p.id ? 'bg-white shadow-2xl scale-[1.03]' : 'bg-white/40 hover:bg-white border-transparent'}`}
                        style={{ 
                          borderColor: selectedPersona.id === p.id ? p.accentColor : 'transparent',
                          animationDelay: `${idx * 0.1}s`
                        }}
                      >
                        {selectedPersona.id === p.id && <div className="absolute top-2 right-2 animate-scale-in"><CheckCircle2 className="w-4 h-4" style={{ color: p.accentColor }} /></div>}
                        <div className={`w-10 h-10 mb-3 rounded-xl bg-gradient-to-br ${p.gradient} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}><PersonaIcon type={p.icon} className="w-5 h-5" /></div>
                        <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{p.tagline}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-white/80 backdrop-blur-md rounded-[3rem] p-10 shadow-2xl border border-white space-y-8 animate-fade-in-up stagger-1">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">What shall we learn?</label>
                    <button 
                      onClick={() => { setAutoSpeak(!autoSpeak); stopSpeaking(); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${autoSpeak ? 'bg-white shadow-md border-slate-200 translate-y-[-2px]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                      style={autoSpeak ? { color: selectedPersona.accentColor } : {}}
                    >
                      <Waves className={`w-3 h-3 ${autoSpeak ? 'animate-pulse' : ''}`} /> Voice: {autoSpeak ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="relative group animate-fade-in-up stagger-2">
                    <input 
                      type="text" value={term} onChange={e => setTerm(e.target.value)}
                      placeholder="e.g. Cloud Computing, AI, Photosynthesis..."
                      onKeyDown={e => e.key === 'Enter' && handleExplain(term)}
                      className="w-full bg-white border-2 border-slate-100 focus:ring-8 rounded-3xl pl-16 pr-32 py-7 text-2xl font-bold transition-all outline-none"
                      style={{ 
                        borderColor: term ? selectedPersona.accentColor : '#f1f5f9',
                        boxShadow: term ? `0 0 0 8px ${selectedPersona.accentColor}11` : 'none'
                      }}
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 transition-colors duration-500" style={term ? { color: selectedPersona.accentColor, transform: 'translateY(-50%) scale(1.1)' } : {}} />
                    
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <button 
                        onClick={toggleVoiceSearch}
                        className={`p-3 rounded-2xl transition-all ${isRecognizing ? 'bg-indigo-500 text-white shadow-lg animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                        style={isRecognizing ? { backgroundColor: selectedPersona.accentColor } : {}}
                      >
                        {isRecognizing ? <Mic className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                      <button onClick={() => handleExplain(term)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100">
                        <ArrowRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 animate-fade-in-up stagger-3">
                    <button 
                      onClick={() => handleExplain(term)} disabled={loading || !term.trim()}
                      className="flex-1 min-w-[200px] text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-100 group"
                      style={{ backgroundColor: selectedPersona.accentColor, boxShadow: `0 20px 30px -10px ${selectedPersona.accentColor}66` }}
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Explore Concept <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" /></>}
                    </button>
                    <button 
                      onClick={startLiveMentorship}
                      className="px-10 bg-white border-2 border-slate-100 text-slate-600 rounded-[2rem] font-black flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-lg active:scale-95 group"
                    >
                      <Phone className="w-7 h-7 group-hover:rotate-12 transition-transform" style={{ color: selectedPersona.accentColor }} />
                    </button>
                  </div>
                </section>

                {(loading || streamingText || currentExplanation) && (
                  <section className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up stagger-4 transition-all duration-700">
                    <div className="h-3 w-full transition-all duration-1000" style={{ background: `linear-gradient(to right, ${selectedPersona.accentColor}, #fff)` }} />
                    <div className="p-10 md:p-16 space-y-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100 animate-fade-in-up">
                        <div className="flex items-center gap-8">
                          <div className={`relative w-24 h-24 rounded-[2rem] bg-gradient-to-br ${selectedPersona.gradient} text-white flex items-center justify-center shadow-2xl transition-all duration-500 ${isSpeaking ? 'scale-110 rotate-3' : ''}`}>
                            <PersonaIcon type={selectedPersona.icon} className={`w-12 h-12 ${isSpeaking ? 'animate-bounce' : 'floating'}`} />
                            {isSpeaking && <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-slate-100 animate-scale-in"><VoiceVisualizer active={true} color={selectedPersona.accentColor} analyser={playbackAnalyserRef.current} /></div>}
                          </div>
                          <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight transition-all">{term}</h3>
                            <div className="flex items-center gap-2 mt-2">
                               <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{selectedPersona.name} Insight</div>
                               {isSynthesizing && <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest animate-pulse italic">Synthesizing Voice...</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="tamil-font text-3xl md:text-4xl leading-[1.6] text-slate-800 whitespace-pre-wrap font-medium animate-fade-in-up stagger-1">
                        {streamingText || currentExplanation?.tamilExplanation}
                      </div>

                      {currentExplanation?.imageUrl && (
                        <div className="relative group animate-fade-in-up stagger-2">
                           <div className="absolute -inset-4 bg-gradient-to-br from-white/0 to-slate-200 rounded-[3rem] -z-10 blur-2xl opacity-30 transition-all group-hover:opacity-50" style={{ backgroundColor: selectedPersona.accentColor }} />
                          <div className="rounded-[3.5rem] overflow-hidden border-[12px] border-white shadow-2xl aspect-video relative group">
                            <img src={currentExplanation.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4000ms]" alt="visual aid" />
                            <div className="absolute bottom-10 left-10 px-6 py-3 bg-black/50 backdrop-blur-md rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                              Visual Context
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center pt-8 animate-fade-in-up stagger-3">
                        <button 
                          onClick={() => { setTerm(''); stopSpeaking(); }}
                          className="px-12 py-5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all hover:border-rose-100 border-2 border-transparent"
                        >
                          Clear Session
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-10 animate-fade-in-up">
             <div className="flex items-center justify-between pb-8 border-b-2 border-slate-100">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Archives</h2>
                <p className="text-sm font-bold text-slate-400 mt-2">Past lessons from your guides</p>
              </div>
              <button 
                onClick={() => { if(window.confirm('Clear all archives?')) setHistory([]); }}
                className="group flex items-center gap-3 text-xs font-black text-rose-400 hover:text-rose-600 px-8 py-5 rounded-2xl hover:bg-rose-50 transition-all border-2 border-transparent uppercase tracking-widest"
              >
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Empty Vault
              </button>
            </div>
            {history.length === 0 ? (
               <div className="text-center py-40 bg-white/40 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center animate-scale-in">
                <HistoryIcon className="w-20 h-20 text-slate-200 mb-6 floating" />
                <p className="text-slate-400 font-black text-2xl uppercase tracking-widest">Archive Empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {history.map((item, idx) => {
                  const p = PERSONAS.find(pers => pers.id === item.personaId) || PERSONAS[0];
                  return (
                    <button 
                      key={item.id} onClick={() => { setCurrentExplanation(item); setTerm(item.term); setSelectedPersona(p); setActiveTab('explain'); stopSpeaking(); }}
                      className="group bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-slate-100 text-left transition-all duration-500 hover:shadow-2xl relative overflow-hidden active:scale-95 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                       <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -mt-10 -mr-10 transition-transform group-hover:scale-150 duration-700" style={{ backgroundColor: p.accentColor }} />
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.gradient} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                            <PersonaIcon type={p.icon} className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: p.accentColor }}>{p.name}</span>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-200 group-hover:translate-x-2 transition-all" />
                      </div>
                      <h4 className="text-3xl font-black text-slate-900 mb-4 transition-colors group-hover:text-slate-700">{item.term}</h4>
                      <p className="tamil-font text-slate-500 line-clamp-3 text-xl font-medium leading-relaxed">{item.tamilExplanation}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
