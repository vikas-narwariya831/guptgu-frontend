import { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Plus,
  ArrowRight,
  Lock,
  Loader2,
  ChevronDown
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
  liteMode?: boolean;
  webSpeed: WebSpeedInfo;
  onInitMedia: (
    startMuted?: boolean,
    startCamOff?: boolean,
    deviceIds?: { audioId?: string; videoId?: string }
  ) => Promise<MediaStream | null> | void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleLiteMode?: (enabled: boolean) => void;
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
  liteMode = false,
  webSpeed,
  onInitMedia,
  onToggleMute,
  onToggleCamera,
  onToggleLiteMode,
  onJoinMeeting
}: LobbyScreenProps) {
  const [userName, setUserName] = useState(
    () => localStorage.getItem('guptgu_username') || ''
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

  const audioLevel = useAudioLevel(localStream, isMuted, !liteMode);

  const hasVideo =
    Boolean(localStream?.getVideoTracks().some((t) => t.readyState === 'live')) && !isCameraOff;

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
    const el = videoRef.current;
    if (!el) return;
    const target = hasVideo ? localStream : null;
    if (el.srcObject !== target) {
      el.srcObject = target;
    }
    return () => {
      if (el.srcObject) el.srcObject = null;
    };
  }, [localStream, hasVideo]);

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
    const clean = userName.trim();
    if (!clean) return;
    const code = generateRoomCode();
    localStorage.setItem('guptgu_username', clean);
    window.history.replaceState({}, document.title, `?room=${code}`);
    onJoinMeeting(code, clean);
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = userName.trim();
    if (!clean || !roomInput.trim()) return;
    let cleanCode = roomInput.trim();
    if (cleanCode.includes('room=')) {
      const match = cleanCode.match(/room=([a-zA-Z0-9-]+)/);
      if (match?.[1]) cleanCode = match[1];
    }
    localStorage.setItem('guptgu_username', clean);
    window.history.replaceState({}, document.title, `?room=${cleanCode.toLowerCase()}`);
    onJoinMeeting(cleanCode, clean);
  };

  const initials =
    userName
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || 'G';

  return (
    <div className="min-h-dvh w-full bg-[#F7F7F5] text-[#14171A] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="w-full border-b border-[#E5E6E1] bg-[#F7F7F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#14171A] flex items-center justify-center text-white">
              <Video size={15} />
            </div>
            <span className="text-[16px] font-bold tracking-[-0.02em] text-[#14171A]">
              guptgu
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5B6066]">
            <button
              type="button"
              onClick={webSpeed.refresh}
              className="font-mono text-[11px] hover:text-[#14171A] transition-colors cursor-pointer"
              title="Refresh connection info"
            >
              {webSpeed.pingMs !== null ? `${webSpeed.pingMs}ms` : webSpeed.effectiveType}
            </button>
            <span className="text-[#D4D6D0]">·</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
              {isConnected ? 'Online' : 'Connecting'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Setup */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left: Clean Video Preview */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-w-0">
          <div className="relative aspect-[16/10] sm:aspect-video w-full rounded-2xl overflow-hidden bg-[#13161B] border border-[#242932] flex items-center justify-center">
            {hasVideo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-2.5 text-center px-4">
                <div className="w-18 h-18 rounded-full bg-[#222731] border border-white/10 flex items-center justify-center text-xl font-semibold text-neutral-200">
                  {initials}
                </div>
                <p className="text-xs text-neutral-400">
                  {isCameraOff ? 'Camera is off' : 'Camera unavailable'}
                </p>
              </div>
            )}

            {/* Subtle Name & Mic Indicator */}
            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 text-[11px] font-medium text-white">
              {!isMuted && audioLevel > 0.1 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
              <span>{userName.trim() || 'Guest'}</span>
            </div>

            {/* Bottom-Center Circular Media Controls */}
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Turn microphone on' : 'Turn microphone off'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-[#212630]/90 text-white hover:bg-[#2C3340] border border-white/15'
                }`}
              >
                {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
              </button>

              <button
                type="button"
                onClick={onToggleCamera}
                aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isCameraOff
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-[#212630]/90 text-white hover:bg-[#2C3340] border border-white/15'
                }`}
              >
                {isCameraOff ? <VideoOff size={17} /> : <Video size={17} />}
              </button>
            </div>
          </div>

          {/* Device Pickers (only shown when devices exist) */}
          {(audioDevices.length > 0 || videoDevices.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {audioDevices.length > 0 && (
                <div className="relative flex items-center">
                  <Mic size={13} className="absolute left-3 text-[#5B6066] pointer-events-none" />
                  <select
                    value={selectedAudioId}
                    onChange={(e) => handleDeviceChange('audio', e.target.value)}
                    className="w-full appearance-none pl-8 pr-7 py-2 rounded-lg bg-white border border-[#E2E3DF] text-xs font-medium text-[#2C3034] outline-none focus:border-[#14171A] truncate cursor-pointer"
                  >
                    {audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 text-[#7C8288] pointer-events-none" />
                </div>
              )}

              {videoDevices.length > 0 && (
                <div className="relative flex items-center">
                  <Video size={13} className="absolute left-3 text-[#5B6066] pointer-events-none" />
                  <select
                    value={selectedVideoId}
                    onChange={(e) => handleDeviceChange('video', e.target.value)}
                    className="w-full appearance-none pl-8 pr-7 py-2 rounded-lg bg-white border border-[#E2E3DF] text-xs font-medium text-[#2C3034] outline-none focus:border-[#14171A] truncate cursor-pointer"
                  >
                    {videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 text-[#7C8288] pointer-events-none" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Clean Entry Form */}
        <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.025em] text-[#14171A] leading-tight">
              Start or join a call
            </h1>
            <p className="text-sm text-[#5B6066]">
              Peer-to-peer video and screen sharing in your browser.
            </p>
          </div>

          <div className="bg-white border border-[#E2E3DF] rounded-2xl p-5 space-y-4">
            {lobbyStatus === 'waiting' ? (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <Loader2 size={24} className="animate-spin text-[#14171A]" />
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-[#14171A]">Asking to join...</h2>
                  <p className="text-xs text-[#5B6066] max-w-xs leading-relaxed">
                    {lobbyMessage || 'Waiting for the host to let you in.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {lobbyStatus === 'rejected' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs font-medium text-rose-700">
                    <Lock size={14} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{lobbyMessage || 'Unable to join this room.'}</span>
                  </div>
                )}

                {!initialRoomCode && (
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#F1F2EE]">
                    <button
                      type="button"
                      onClick={() => setEntryMode('create')}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        entryMode === 'create'
                          ? 'bg-white text-[#14171A] shadow-2xs'
                          : 'text-[#5B6066] hover:text-[#14171A]'
                      }`}
                    >
                      New room
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('join')}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        entryMode === 'join'
                          ? 'bg-white text-[#14171A] shadow-2xs'
                          : 'text-[#5B6066] hover:text-[#14171A]'
                      }`}
                    >
                      Join with code
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#4A4F54]">Your name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={32}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] border border-[#E2E3DF] focus:bg-white focus:border-[#14171A] text-sm text-[#14171A] placeholder-[#9CA3AF] outline-none transition-colors"
                  />
                </div>

                {initialRoomCode || entryMode === 'join' ? (
                  <form onSubmit={handleJoinExisting} className="space-y-3">
                    {initialRoomCode ? (
                      <div className="px-3.5 py-2.5 rounded-xl bg-[#F4F5F2] border border-[#E2E3DF] text-xs flex items-center justify-between">
                        <span className="text-[#5B6066] font-medium">Room</span>
                        <span className="font-mono font-semibold text-[#14171A]">{roomInput}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#4A4F54]">Room code or link</label>
                        <input
                          type="text"
                          value={roomInput}
                          onChange={(e) => setRoomInput(e.target.value)}
                          placeholder="e.g. abc-defg-hij"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] border border-[#E2E3DF] focus:bg-white focus:border-[#14171A] text-sm text-[#14171A] placeholder-[#9CA3AF] outline-none font-mono transition-colors"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!roomInput.trim() || !userName.trim() || !isConnected}
                      className="w-full py-2.5 rounded-xl bg-[#14171A] hover:bg-[#272C33] disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Join call</span>
                      <ArrowRight size={15} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartNewMeeting}
                    disabled={!userName.trim() || !isConnected}
                    className="w-full py-2.5 rounded-xl bg-[#14171A] hover:bg-[#272C33] disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>New call</span>
                  </button>
                )}

                {onToggleLiteMode && (
                  <div className="pt-2 border-t border-[#ECECE8] flex items-center justify-between text-xs">
                    <span className="text-[#5B6066]">
                      Low-RAM mode {liteMode ? '(on)' : '(off)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleLiteMode(!liteMode)}
                      className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                        liteMode
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-[#F1F2EE] text-[#4A4F54] hover:text-[#14171A]'
                      }`}
                    >
                      {liteMode ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto px-4 py-4 text-center text-[11px] text-[#8B9196]">
        guptgu · peer-to-peer calls, nothing stored
      </footer>
    </div>
  );
}
