import { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Plus,
  ArrowRight,
  ShieldCheck,
  MonitorUp,
  Lock,
  Loader2,
  Keyboard,
  ChevronDown,
  Wifi
} from 'lucide-react';
import { generateRoomCode } from '../../utils/roomUtils';
import { useAudioLevel } from '../../hooks/useAudioLevel';
import type { WebSpeedInfo } from '../../hooks/useNetworkSpeed';
import type { LobbyStatus } from '../../types/meet';

interface LobbyScreenProps {
  initialRoomCode?: string;
  lobbyStatus: LobbyStatus;
  lobbyMessage: string;
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isConnected: boolean;
  webSpeed: WebSpeedInfo;
  onInitMedia: (
    startMuted?: boolean,
    startCamOff?: boolean,
    deviceIds?: { audioId?: string; videoId?: string }
  ) => Promise<MediaStream | null> | void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onJoinMeeting: (roomCode: string, userName: string) => void;
}

export default function LobbyScreen({
  initialRoomCode = '',
  lobbyStatus,
  lobbyMessage,
  localStream,
  isMuted,
  isCameraOff,
  isConnected,
  webSpeed,
  onInitMedia,
  onToggleMute,
  onToggleCamera,
  onJoinMeeting
}: LobbyScreenProps) {
  const [userName, setUserName] = useState(
    () => localStorage.getItem('guptgu_username') || 'Vikas Narwariya'
  );
  const [roomInput, setRoomInput] = useState(initialRoomCode);
  const [entryMode, setEntryMode] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create'
  );
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const audioLevel = useAudioLevel(localStream, isMuted);

  useEffect(() => {
    const setup = async () => {
      await onInitMedia();
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === 'audioinput');
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setAudioDevices(mics);
        setVideoDevices(cams);
        if (mics[0]?.deviceId) setSelectedAudioId(mics[0].deviceId);
        if (cams[0]?.deviceId) setSelectedVideoId(cams[0].deviceId);
      } catch {
        // ignore device enumeration block
      }
    };
    setup();
  }, [onInitMedia]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleDeviceChange = (kind: 'audio' | 'video', deviceId: string) => {
    const nextAudio = kind === 'audio' ? deviceId : selectedAudioId;
    const nextVideo = kind === 'video' ? deviceId : selectedVideoId;
    if (kind === 'audio') setSelectedAudioId(deviceId);
    else setSelectedVideoId(deviceId);
    onInitMedia(isMuted, isCameraOff, {
      audioId: nextAudio || undefined,
      videoId: nextVideo || undefined
    });
  };

  const handleStartNewMeeting = () => {
    if (!userName.trim()) return;
    const code = generateRoomCode();
    localStorage.setItem('guptgu_username', userName.trim());
    window.history.replaceState({}, document.title, `?room=${code}`);
    onJoinMeeting(code, userName.trim());
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !roomInput.trim()) return;
    let cleanCode = roomInput.trim();
    if (cleanCode.includes('room=')) {
      const match = cleanCode.match(/room=([a-zA-Z0-9-]+)/);
      if (match?.[1]) cleanCode = match[1];
    }
    localStorage.setItem('guptgu_username', userName.trim());
    window.history.replaceState({}, document.title, `?room=${cleanCode.toLowerCase()}`);
    onJoinMeeting(cleanCode, userName.trim());
  };

  const hasVideo =
    Boolean(localStream?.getVideoTracks().some((t) => t.readyState === 'live')) && !isCameraOff;

  const initials = userName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'G';

  return (
    <div className="min-h-screen w-full bg-[#FAFBF9] text-[#111827] flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Architectural Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage: 'radial-gradient(#D5DBD6 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="fixed -top-48 left-1/3 w-[560px] h-[560px] rounded-full bg-[#DCEFE5]/60 blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full bg-white/90 backdrop-blur-md border-b border-[#E6E9E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Custom Guptgu Emblem */}
            <div className="w-9 h-9 rounded-xl bg-[#0D6E4E] flex items-center justify-center text-white shadow-sm shadow-[#0D6E4E]/25">
              <Video size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[19px] font-extrabold tracking-[-0.03em] text-[#111827]">
                Guptgu
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#0D6E4E] border border-[#CBE7D8]">
                <Lock size={9} /> Private P2P
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Web Speed Badge */}
            <button
              type="button"
              onClick={webSpeed.refresh}
              title="Click to refresh internet speed"
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                webSpeed.label === 'Slow'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : webSpeed.label === 'Moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-[#EDF7F2] text-[#0D6E4E] border-[#CBE7D8]'
              }`}
            >
              <Wifi size={12} />
              <span className="font-mono">
                {webSpeed.downlinkMbps !== null ? `↓ ${webSpeed.downlinkMbps} Mbps` : webSpeed.effectiveType}
              </span>
              {webSpeed.pingMs !== null && (
                <span className="text-[11px] opacity-80">· {webSpeed.pingMs}ms</span>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#4B5563] bg-white border border-[#E6E9E6] px-3.5 py-1.5 rounded-full shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-[#0D6E4E] animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="hidden md:inline">
                {isConnected ? 'Encrypted Signaling Ready' : 'Connecting...'}
              </span>
              <span className="md:hidden">{isConnected ? 'Ready' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left: Framed Studio Preview */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          <div className="p-2.5 bg-white rounded-[26px] border border-[#E4E7E4] shadow-[0_1px_3px_rgba(16,24,40,0.04),0_20px_40px_-12px_rgba(16,24,40,0.08)]">
            <div className="relative aspect-video w-full rounded-[18px] overflow-hidden bg-[#111614] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${
                  hasVideo ? 'opacity-100' : 'opacity-0 absolute'
                }`}
              />

              {!hasVideo && (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-22 h-22 rounded-full bg-[#0D6E4E]/20 border border-[#34D399]/35 ring-8 ring-[#0D6E4E]/10 flex items-center justify-center text-2xl font-extrabold text-[#A7F3D0]">
                    {initials}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white">Camera is turned off</p>
                    <p className="text-xs text-slate-400">
                      {isMuted ? 'Microphone is muted' : 'Microphone is active'} · Studio ready
                    </p>
                  </div>
                </div>
              )}

              {/* Live Mic Meter Pill */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white">
                {!isMuted ? (
                  <span className="flex items-end gap-0.5 h-3">
                    <span
                      className="w-0.5 rounded-full bg-[#34D399] transition-all duration-75"
                      style={{ height: `${Math.max(25, Math.round(audioLevel * 100))}%` }}
                    />
                    <span
                      className="w-0.5 rounded-full bg-[#34D399] transition-all duration-75"
                      style={{ height: `${Math.max(40, Math.round(audioLevel * 100))}%` }}
                    />
                    <span
                      className="w-0.5 rounded-full bg-[#34D399] transition-all duration-75"
                      style={{ height: `${Math.max(25, Math.round(audioLevel * 100))}%` }}
                    />
                  </span>
                ) : (
                  <MicOff size={11} className="text-rose-400" />
                )}
                <span>{userName.trim() || 'Guest'}</span>
              </div>

              {/* Preview Controls Pill */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#E4E7E4] shadow-xl">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E]'
                  }`}
                >
                  {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                  <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic On'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleCamera}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCameraOff
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E]'
                  }`}
                >
                  {isCameraOff ? <VideoOff size={15} /> : <Video size={15} />}
                  <span className="hidden sm:inline">{isCameraOff ? 'Cam Off' : 'Cam On'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Device Pickers */}
          {(audioDevices.length > 0 || videoDevices.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 px-0.5">
              {audioDevices.length > 0 && (
                <div className="relative flex items-center">
                  <Mic size={13} className="absolute left-3 text-[#0D6E4E] pointer-events-none" />
                  <select
                    value={selectedAudioId}
                    onChange={(e) => handleDeviceChange('audio', e.target.value)}
                    className="w-full appearance-none pl-8 pr-8 py-2.5 rounded-xl bg-white border border-[#E4E7E4] text-xs font-medium text-[#374151] outline-none focus:border-[#0D6E4E] shadow-[0_1px_2px_rgba(16,24,40,0.03)] truncate cursor-pointer"
                  >
                    {audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 text-[#6B7280] pointer-events-none" />
                </div>
              )}

              {videoDevices.length > 0 && (
                <div className="relative flex items-center">
                  <Video size={13} className="absolute left-3 text-[#0D6E4E] pointer-events-none" />
                  <select
                    value={selectedVideoId}
                    onChange={(e) => handleDeviceChange('video', e.target.value)}
                    className="w-full appearance-none pl-8 pr-8 py-2.5 rounded-xl bg-white border border-[#E4E7E4] text-xs font-medium text-[#374151] outline-none focus:border-[#0D6E4E] shadow-[0_1px_2px_rgba(16,24,40,0.03)] truncate cursor-pointer"
                  >
                    {videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 text-[#6B7280] pointer-events-none" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Executive Meeting Card */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.03em] text-[#111827] leading-[1.1]">
              Private conversations,{' '}
              <span className="text-[#0D6E4E]">without the clutter.</span>
            </h1>
            <p className="text-[14px] text-[#4B5563] leading-relaxed">
              Guptgu delivers direct peer-to-peer video, crisp screen sharing, and low-bandwidth resilience — no sign-up, no tracking.
            </p>
          </div>

          <div className="bg-white border border-[#E4E7E4] rounded-3xl p-6 space-y-5 shadow-[0_1px_3px_rgba(16,24,40,0.04),0_20px_40px_-14px_rgba(16,24,40,0.07)]">
            {lobbyStatus === 'waiting' ? (
              <div className="py-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EDF7F2] border border-[#CBE7D8] flex items-center justify-center text-[#0D6E4E]">
                  <Loader2 size={28} className="animate-spin" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[#111827]">Asking to be let in...</h2>
                  <p className="text-xs text-[#6B7280] max-w-xs leading-relaxed">
                    {lobbyMessage || 'Waiting for the meeting host to admit you into the room.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {lobbyStatus === 'rejected' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-medium text-rose-700">
                    <Lock size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{lobbyMessage || 'You cannot join this meeting.'}</span>
                  </div>
                )}

                {!initialRoomCode && (
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F3F5F3]">
                    <button
                      type="button"
                      onClick={() => setEntryMode('create')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        entryMode === 'create'
                          ? 'bg-white text-[#0D6E4E] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      New Meeting
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('join')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        entryMode === 'join'
                          ? 'bg-white text-[#0D6E4E] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Join with Code
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={32}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFBF9] border border-[#E4E7E4] focus:bg-white focus:border-[#0D6E4E] focus:ring-3 focus:ring-[#0D6E4E]/10 text-sm font-medium text-[#111827] placeholder-[#9CA3AF] outline-none transition-all"
                  />
                </div>

                {initialRoomCode || entryMode === 'join' ? (
                  <form onSubmit={handleJoinExisting} className="space-y-3.5">
                    {initialRoomCode ? (
                      <div className="p-3 rounded-xl bg-[#EDF7F2] border border-[#CBE7D8] text-xs text-[#0B4F38] flex items-center justify-between">
                        <span className="font-semibold">Meeting Code</span>
                        <span className="font-mono font-bold tracking-wide">{roomInput}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                          Meeting Code or Link
                        </label>
                        <div className="relative">
                          <Keyboard
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
                          />
                          <input
                            type="text"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value)}
                            placeholder="kqz-mnpw-xvt or invite URL"
                            className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#FAFBF9] border border-[#E4E7E4] focus:bg-white focus:border-[#0D6E4E] focus:ring-3 focus:ring-[#0D6E4E]/10 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none font-mono transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!roomInput.trim() || !userName.trim() || !isConnected}
                      className="w-full py-3.5 rounded-xl bg-[#0D6E4E] hover:bg-[#0A573D] disabled:opacity-45 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0D6E4E]/20"
                    >
                      <span>{initialRoomCode ? 'Ask / Join Guptgu' : 'Join Meeting'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartNewMeeting}
                    disabled={!userName.trim() || !isConnected}
                    className="w-full py-3.5 rounded-xl bg-[#0D6E4E] hover:bg-[#0A573D] disabled:opacity-45 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0D6E4E]/20 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Plus size={18} />
                    <span>Start Instant Guptgu</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B7280] font-medium px-1">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#0D6E4E]" /> Host Controls &amp; Waiting Room
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MonitorUp size={14} className="text-[#0D6E4E]" /> Adaptive Low-Net Mode
            </span>
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-6xl w-full mx-auto px-4 py-4 text-center text-xs text-[#9CA3AF]">
        Guptgu · Private Peer-to-Peer Meetings · Zero Data Stored
      </footer>
    </div>
  );
}
