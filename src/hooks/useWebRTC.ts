import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../utils/socket';
import type {
  ChatMessage,
  FloatingReaction,
  LobbyStatus,
  NetworkQuality,
  NetworkStats,
  PeerInfo,
  RoomSettings,
  VideoQualityMode,
  WaitingGuest
} from '../types/meet';

function buildIceServers(): RTCConfiguration {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUser = import.meta.env.VITE_TURN_USER;
  const turnPass = import.meta.env.VITE_TURN_PASS;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      ...(turnUser ? { username: turnUser } : {}),
      ...(turnPass ? { credential: turnPass } : {})
    });
  }

  return { iceServers: servers };
}

const ICE_SERVERS: RTCConfiguration = buildIceServers();

const isMobileDevice = (): boolean =>
  typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const DEFAULT_NETWORK_STATS: NetworkStats = {
  quality: 'good',
  rttMs: null,
  packetLossPct: 0,
  activeCapKbps: 900,
  uploadKbps: 0,
  downloadKbps: 0,
  isThrottled: false
};

const DEFAULT_SETTINGS: RoomSettings = {
  isLocked: false,
  waitingRoomEnabled: false,
  allowScreenShare: true,
  allowChat: true,
  allowUnmute: true
};

interface UseWebRTCOptions {
  onMediaWarning?: (msg: string) => void;
  onRoomError?: (msg: string) => void;
}

export function useWebRTC({ onMediaWarning, onRoomError }: UseWebRTCOptions = {}) {
  const [inCall, setInCall] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus>('idle');
  const [lobbyMessage, setLobbyMessage] = useState('');
  const [roomId, setRoomId] = useState('');
  const [selfName, setSelfName] = useState('');
  const [hostId, setHostId] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [meetingStartedAt, setMeetingStartedAt] = useState<number>(Date.now());
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [waitingList, setWaitingList] = useState<WaitingGuest[]>([]);

  // Local media & UI states
  const [localCameraStream, setLocalCameraStream] = useState<MediaStream | null>(null);
  const [localDisplayStream, setLocalDisplayStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Remote peers, chat & reactions
  const [remotePeers, setRemotePeers] = useState<PeerInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // Adaptive Low-Internet & Mobile Quality Mode
  const [videoQualityMode, setVideoQualityMode] = useState<VideoQualityMode>(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (
      isMobileDevice() ||
      conn?.saveData ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === 'slow-2g'
    ) {
      return 'data-saver';
    }
    return 'auto';
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats>(DEFAULT_NETWORK_STATS);

  // Internal WebRTC refs
  const localCameraStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isMutedRef = useRef(isMuted);
  const isCameraOffRef = useRef(isCameraOff);
  const isScreenSharingRef = useRef(isScreenSharing);
  const hostIdRef = useRef(hostId);
  const roomSettingsRef = useRef(roomSettings);
  const videoQualityModeRef = useRef(videoQualityMode);
  const camStateBeforeAudioOnlyRef = useRef<boolean | null>(null);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isCameraOffRef.current = isCameraOff; }, [isCameraOff]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);
  useEffect(() => { hostIdRef.current = hostId; }, [hostId]);
  useEffect(() => { roomSettingsRef.current = roomSettings; }, [roomSettings]);
  useEffect(() => { videoQualityModeRef.current = videoQualityMode; }, [videoQualityMode]);

  const isHost = Boolean(socket.id && hostId && socket.id === hostId);

  // ── Acquire Camera / Mic gracefully ──────────────────────────────────────
  const initLocalMedia = useCallback(async (
    startMuted = false,
    startCamOff = false,
    deviceIds?: { audioId?: string; videoId?: string }
  ) => {
    if (localCameraStreamRef.current) {
      localCameraStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    const mobile = isMobileDevice();
    const targetWidth = mobile ? 640 : 1280;
    const targetHeight = mobile ? 360 : 720;
    const targetFps = mobile ? 20 : 30;

    const videoConstraint: MediaTrackConstraints = deviceIds?.videoId
      ? {
          deviceId: { exact: deviceIds.videoId },
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
          frameRate: { ideal: targetFps, max: mobile ? 24 : 30 }
        }
      : {
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
          frameRate: { ideal: targetFps, max: mobile ? 24 : 30 },
          facingMode: 'user'
        };

    const audioConstraint: MediaTrackConstraints = deviceIds?.audioId
      ? { deviceId: { exact: deviceIds.audioId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: audioConstraint
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false });
        setIsCameraOff(true);
        isCameraOffRef.current = true;
        onMediaWarning?.('Camera not available — joined with microphone only.');
      } catch {
        stream = null;
        setIsMuted(true);
        setIsCameraOff(true);
        isMutedRef.current = true;
        isCameraOffRef.current = true;
        onMediaWarning?.('No camera/mic detected — joined in listen & screen-share mode.');
      }
    }

    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !startMuted;
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !startCamOff;
      });
      setIsMuted(startMuted || stream.getAudioTracks().length === 0);
      setIsCameraOff(startCamOff || stream.getVideoTracks().length === 0);
    }

    localCameraStreamRef.current = stream;
    setLocalCameraStream(stream);
    setLocalDisplayStream(stream);
    return stream;
  }, [onMediaWarning]);

  const stopAllLocalMedia = useCallback(() => {
    localCameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    localScreenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localCameraStreamRef.current = null;
    localScreenStreamRef.current = null;
    setLocalCameraStream(null);
    setLocalDisplayStream(null);
    setIsScreenSharing(false);
    setIsHandRaised(false);
  }, []);

  const resetCallState = useCallback((noticeMessage?: string) => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemotePeers([]);
    setMessages([]);
    setWaitingList([]);
    setRoomSettings(DEFAULT_SETTINGS);
    setHostId('');
    setInCall(false);
    setLobbyStatus('idle');
    setLobbyMessage('');
    setRoomId('');
    stopAllLocalMedia();
    window.history.replaceState({}, document.title, window.location.pathname);
    if (noticeMessage) {
      onRoomError?.(noticeMessage);
    }
  }, [onRoomError, stopAllLocalMedia]);

  // ── Create & configure RTCPeerConnection for a remote peer ───────────────
  const createPeerConnection = useCallback((peerId: string) => {
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

    const activeStream = localCameraStreamRef.current;
    const screenTrack = localScreenStreamRef.current?.getVideoTracks()[0];
    const camVideoTrack = activeStream?.getVideoTracks()[0];
    const audioTrack = activeStream?.getAudioTracks()[0];

    if (audioTrack && activeStream) {
      pc.addTrack(audioTrack, activeStream);
    } else {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    }

    if (screenTrack && localScreenStreamRef.current) {
      pc.addTrack(screenTrack, localScreenStreamRef.current);
    } else if (camVideoTrack && activeStream) {
      pc.addTrack(camVideoTrack, activeStream);
    } else {
      pc.addTransceiver('video', { direction: 'sendrecv' });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          targetId: peerId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;
      setRemotePeers((prev) =>
        prev.map((p) => (p.id === peerId ? { ...p, stream: remoteStream } : p))
      );
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.restartIce?.();
      }
    };

    return pc;
  }, []);

  const flushPendingCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current.get(peerId);
    if (!queued?.length) return;
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('ICE candidate flush warning:', err);
      }
    }
    pendingCandidatesRef.current.delete(peerId);
  }, []);

  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    pendingCandidatesRef.current.delete(peerId);
  }, []);

  const replaceOutgoingVideoTrack = useCallback(async (newTrack: MediaStreamTrack | null) => {
    const replacements: Promise<void>[] = [];
    peerConnectionsRef.current.forEach((pc) => {
      const videoTransceiver = pc
        .getTransceivers()
        .find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
      if (videoTransceiver?.sender) {
        replacements.push(videoTransceiver.sender.replaceTrack(newTrack));
      }
    });
    await Promise.allSettled(replacements);
  }, []);

  /**
   * Applies adaptive video bitrate, resolution scaling, and framerate caps
   * across all active WebRTC peer connections based on selected quality mode & peer count.
   */
  const applyBitrateProfile = useCallback(
    async (mode: VideoQualityMode, networkIsPoor = false): Promise<number> => {
      const peerCount = Math.max(1, peerConnectionsRef.current.size);
      const effectiveMode: VideoQualityMode =
        mode === 'auto' && networkIsPoor ? 'data-saver' : mode;

      let maxBitrate = 1_200_000;
      let scaleDown = 1;
      let maxFps = 30;

      if (effectiveMode === 'audio-only') {
        maxBitrate = 60_000;
        scaleDown = 4;
        maxFps = 5;
      } else if (effectiveMode === 'data-saver') {
        const mobile = isMobileDevice();
        maxBitrate = Math.max(150_000, Math.round((mobile ? 320_000 : 260_000) / Math.min(peerCount, 2)));
        // Mobile already captures 360p directly, so avoid double-downscaling
        scaleDown = mobile ? 1 : 2;
        maxFps = 18;
      } else if (effectiveMode === 'auto') {
        // Split upload budget cleanly when multiple peers are connected
        maxBitrate = Math.max(250_000, Math.round(950_000 / Math.min(peerCount, 4)));
        scaleDown = peerCount >= 4 ? 1.5 : 1;
        maxFps = peerCount >= 4 ? 20 : 28;
      } else if (effectiveMode === 'hd') {
        maxBitrate = Math.max(500_000, Math.round(1_250_000 / Math.min(peerCount, 3)));
        scaleDown = 1;
        maxFps = 30;
      }

      const updates: Promise<void>[] = [];
      peerConnectionsRef.current.forEach((pc) => {
        const videoSender = pc
          .getTransceivers()
          .find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video')?.sender;
        if (!videoSender) return;

        updates.push(
          (async () => {
            try {
              const params = videoSender.getParameters();
              if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
              }
              params.encodings[0].maxBitrate = maxBitrate;
              // Preserve higher resolution when sharing screen, otherwise scale down on low net
              params.encodings[0].scaleResolutionDownBy = isScreenSharingRef.current ? 1 : scaleDown;
              params.encodings[0].maxFramerate = isScreenSharingRef.current ? 15 : maxFps;
              params.degradationPreference = 'maintain-framerate';
              await videoSender.setParameters(params);
            } catch {
              // Some browsers restrict setParameters on inactive senders
            }
          })()
        );
      });

      await Promise.allSettled(updates);
      return Math.round(maxBitrate / 1000);
    },
    []
  );

  const stopScreenShare = useCallback(async () => {
    localScreenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localScreenStreamRef.current = null;
    setIsScreenSharing(false);

    const camTrack = localCameraStreamRef.current?.getVideoTracks()[0] || null;
    await replaceOutgoingVideoTrack(camTrack);
    setLocalDisplayStream(localCameraStreamRef.current);

    if (inCall) {
      socket.emit('media-state-changed', { isScreenSharing: false });
    }
  }, [inCall, replaceOutgoingVideoTrack]);

  // ── Socket Signaling & Host Management Listeners ─────────────────────────
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onWaitingRoomPending = ({ message }: { roomId: string; message: string }) => {
      setLobbyStatus('waiting');
      setLobbyMessage(message || 'Waiting for the host to admit you...');
    };

    const onJoinRejected = ({ message }: { reason: string; message: string }) => {
      setLobbyStatus('rejected');
      setLobbyMessage(message || 'Unable to join meeting.');
      onRoomError?.(message);
    };

    const onRoomJoined = async ({
      roomId: joinedId,
      createdAt,
      hostId: roomHostId,
      settings,
      peers,
      waitingList: initialWaiting,
      messages: history
    }: {
      roomId: string;
      selfId: string;
      createdAt: number;
      hostId: string;
      settings: RoomSettings;
      peers: PeerInfo[];
      waitingList: WaitingGuest[];
      messages: ChatMessage[];
    }) => {
      setRoomId(joinedId);
      setMeetingStartedAt(createdAt || Date.now());
      setHostId(roomHostId || '');
      setRoomSettings(settings || DEFAULT_SETTINGS);
      setWaitingList(initialWaiting || []);
      setRemotePeers(peers.map((p) => ({ ...p, stream: null })));
      setMessages(history || []);
      setLobbyStatus('idle');
      setLobbyMessage('');
      setInCall(true);

      // Force local mute if host restricted unmuting before join
      if (settings && !settings.allowUnmute && roomHostId !== socket.id) {
        localCameraStreamRef.current?.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
        setIsMuted(true);
      }

      for (const peer of peers) {
        try {
          const pc = createPeerConnection(peer.id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { targetId: peer.id, offer });
        } catch (err) {
          console.error('Failed creating offer for peer:', peer.id, err);
        }
      }
    };

    const onUserJoined = ({ peer }: { peer: PeerInfo }) => {
      setRemotePeers((prev) => {
        if (prev.some((p) => p.id === peer.id)) return prev;
        return [...prev, { ...peer, stream: null }];
      });
    };

    const onWebRTCOffer = async ({
      fromId,
      fromPeer,
      offer
    }: {
      fromId: string;
      fromPeer: PeerInfo;
      offer: RTCSessionDescriptionInit;
    }) => {
      setRemotePeers((prev) => {
        if (prev.some((p) => p.id === fromId)) return prev;
        return [...prev, { ...fromPeer, stream: null }];
      });

      try {
        const pc = createPeerConnection(fromId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates(fromId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { targetId: fromId, answer });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    };

    const onWebRTCAnswer = async ({
      fromId,
      answer
    }: {
      fromId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = peerConnectionsRef.current.get(fromId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(fromId, pc);
      } catch (err) {
        console.error('Error setting remote answer:', err);
      }
    };

    const onIceCandidate = async ({
      fromId,
      candidate
    }: {
      fromId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnectionsRef.current.get(fromId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate:', err);
        }
      } else {
        const queue = pendingCandidatesRef.current.get(fromId) || [];
        queue.push(candidate);
        pendingCandidatesRef.current.set(fromId, queue);
      }
    };

    const onPeerMediaUpdated = (updated: PeerInfo & { peerId: string }) => {
      setRemotePeers((prev) =>
        prev.map((p) =>
          p.id === updated.peerId
            ? {
                ...p,
                isMuted: updated.isMuted,
                isCameraOff: updated.isCameraOff,
                isScreenSharing: updated.isScreenSharing,
                isHandRaised: updated.isHandRaised,
                isHost: updated.isHost
              }
            : p
        )
      );
    };

    const onUserLeft = ({ peerId }: { peerId: string }) => {
      closePeerConnection(peerId);
      setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
    };

    const onChatMessage = (msg: ChatMessage) => {
      // Cap in-memory chat history to last 100 messages to prevent RAM growth in long calls
      setMessages((prev) => (prev.length >= 100 ? [...prev.slice(-99), msg] : [...prev, msg]));
    };

    const onPeerReaction = (reaction: FloatingReaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    };

    const onRoomFull = ({ message }: { message: string }) => {
      setLobbyStatus('rejected');
      setLobbyMessage(message);
      onRoomError?.(message);
    };

    // ── Host Control Events ────────────────────────────────────────────────
    const onRoomSettingsUpdated = ({ settings }: { settings: RoomSettings }) => {
      setRoomSettings(settings);
    };

    const onWaitingRoomUpdated = ({
      waitingList: list,
      latestGuest
    }: {
      waitingList: WaitingGuest[];
      latestGuest?: WaitingGuest;
    }) => {
      setWaitingList(list || []);
      if (latestGuest) {
        onMediaWarning?.(`${latestGuest.name} wants to join the meeting.`);
      }
    };

    const onForceMute = ({ byHost }: { byHost?: boolean }) => {
      localCameraStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
      setIsMuted(true);
      if (byHost) {
        onMediaWarning?.('You were muted by the host.');
      }
    };

    const onForceStopScreenshare = () => {
      stopScreenShare();
      onMediaWarning?.('Host turned off participant screen sharing.');
    };

    const onForceLowerHand = () => {
      setIsHandRaised(false);
    };

    const onHostChanged = ({
      newHostId,
      newHostName
    }: {
      newHostId: string;
      newHostName: string;
    }) => {
      setHostId(newHostId);
      if (newHostId === socket.id) {
        onMediaWarning?.('You are now the meeting host!');
      } else {
        onMediaWarning?.(`${newHostName} is now the meeting host.`);
      }
    };

    const onHostActionNotice = ({ message }: { message: string }) => {
      onMediaWarning?.(message);
    };

    const onRemovedByHost = ({ message }: { message: string }) => {
      resetCallState(message || 'You were removed from the meeting by the host.');
    };

    const onMeetingEnded = ({ message }: { message: string }) => {
      resetCallState(message || 'The host ended the meeting.');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('waiting-room-pending', onWaitingRoomPending);
    socket.on('join-rejected', onJoinRejected);
    socket.on('room-joined', onRoomJoined);
    socket.on('user-joined', onUserJoined);
    socket.on('webrtc-offer', onWebRTCOffer);
    socket.on('webrtc-answer', onWebRTCAnswer);
    socket.on('webrtc-ice-candidate', onIceCandidate);
    socket.on('peer-media-updated', onPeerMediaUpdated);
    socket.on('user-left', onUserLeft);
    socket.on('chat-message', onChatMessage);
    socket.on('peer-reaction', onPeerReaction);
    socket.on('room-full', onRoomFull);
    socket.on('room-settings-updated', onRoomSettingsUpdated);
    socket.on('waiting-room-updated', onWaitingRoomUpdated);
    socket.on('force-mute', onForceMute);
    socket.on('force-stop-screenshare', onForceStopScreenshare);
    socket.on('force-lower-hand', onForceLowerHand);
    socket.on('host-changed', onHostChanged);
    socket.on('host-action-notice', onHostActionNotice);
    socket.on('removed-by-host', onRemovedByHost);
    socket.on('meeting-ended', onMeetingEnded);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('waiting-room-pending', onWaitingRoomPending);
      socket.off('join-rejected', onJoinRejected);
      socket.off('room-joined', onRoomJoined);
      socket.off('user-joined', onUserJoined);
      socket.off('webrtc-offer', onWebRTCOffer);
      socket.off('webrtc-answer', onWebRTCAnswer);
      socket.off('webrtc-ice-candidate', onIceCandidate);
      socket.off('peer-media-updated', onPeerMediaUpdated);
      socket.off('user-left', onUserLeft);
      socket.off('chat-message', onChatMessage);
      socket.off('peer-reaction', onPeerReaction);
      socket.off('room-full', onRoomFull);
      socket.off('room-settings-updated', onRoomSettingsUpdated);
      socket.off('waiting-room-updated', onWaitingRoomUpdated);
      socket.off('force-mute', onForceMute);
      socket.off('force-stop-screenshare', onForceStopScreenshare);
      socket.off('force-lower-hand', onForceLowerHand);
      socket.off('host-changed', onHostChanged);
      socket.off('host-action-notice', onHostActionNotice);
      socket.off('removed-by-host', onRemovedByHost);
      socket.off('meeting-ended', onMeetingEnded);
    };
  }, [
    createPeerConnection,
    flushPendingCandidates,
    closePeerConnection,
    onRoomError,
    onMediaWarning,
    resetCallState,
    stopScreenShare
  ]);

  // ── User Actions ─────────────────────────────────────────────────────────
  const joinMeeting = useCallback((targetRoom: string, name: string) => {
    const cleanName = name.trim() || 'Guest';
    setSelfName(cleanName);
    setLobbyStatus('idle');
    setLobbyMessage('');
    socket.emit('join-room', {
      roomId: targetRoom.trim().toLowerCase(),
      userName: cleanName,
      isMuted: isMutedRef.current,
      isCameraOff: isCameraOffRef.current
    });
  }, []);

  const leaveMeeting = useCallback(() => {
    socket.emit('leave-room');
    resetCallState();
  }, [resetCallState]);

  const toggleMute = useCallback(() => {
    const stream = localCameraStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0];
    if (!audioTrack) {
      onMediaWarning?.('No microphone found on this device.');
      return;
    }

    const nextMuted = !isMutedRef.current;
    const amHost = Boolean(socket.id && hostIdRef.current === socket.id);
    if (inCall && !amHost && !nextMuted && !roomSettingsRef.current.allowUnmute) {
      onMediaWarning?.('Host has disabled unmuting microphones.');
      return;
    }

    audioTrack.enabled = !nextMuted;
    setIsMuted(nextMuted);
    if (inCall) {
      socket.emit('media-state-changed', { isMuted: nextMuted });
    }
  }, [inCall, onMediaWarning]);

  const toggleCamera = useCallback(() => {
    const stream = localCameraStreamRef.current;
    const videoTrack = stream?.getVideoTracks()[0];
    if (!videoTrack) {
      onMediaWarning?.('No camera found on this device.');
      return;
    }
    const nextCamOff = !isCameraOffRef.current;
    videoTrack.enabled = !nextCamOff;
    setIsCameraOff(nextCamOff);
    if (inCall) {
      socket.emit('media-state-changed', { isCameraOff: nextCamOff });
    }
  }, [inCall, onMediaWarning]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      await stopScreenShare();
      return;
    }

    const amHost = Boolean(socket.id && hostIdRef.current === socket.id);
    if (inCall && !amHost && !roomSettingsRef.current.allowScreenShare) {
      onMediaWarning?.('Host has disabled screen sharing for participants.');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15, max: 20 } },
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      // Hint encoder to prioritize crisp text/UI detail over high motion FPS
      if ('contentHint' in screenTrack) {
        screenTrack.contentHint = 'detail';
      }

      localScreenStreamRef.current = screenStream;
      setLocalDisplayStream(screenStream);
      setIsScreenSharing(true);

      await replaceOutgoingVideoTrack(screenTrack);
      await applyBitrateProfile(videoQualityModeRef.current, networkStats.quality === 'poor');
      socket.emit('media-state-changed', { isScreenSharing: true });

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        onMediaWarning?.('Screen share permission cancelled or unavailable.');
      }
    }
  }, [inCall, onMediaWarning, replaceOutgoingVideoTrack, stopScreenShare]);

  const toggleHandRaise = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    socket.emit('media-state-changed', { isHandRaised: next });
  }, [isHandRaised]);

  const sendReaction = useCallback((emoji: string) => {
    socket.emit('send-reaction', { emoji });
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    socket.emit('send-chat-message', { text });
  }, []);

  // ── Host Management Actions ──────────────────────────────────────────────
  const updateRoomSettings = useCallback((partial: Partial<RoomSettings>) => {
    socket.emit('host-update-settings', partial);
  }, []);

  const admitGuest = useCallback((guestId: string) => {
    socket.emit('host-admit-guest', { guestId });
  }, []);

  const admitAllGuests = useCallback(() => {
    socket.emit('host-admit-all');
  }, []);

  const denyGuest = useCallback((guestId: string) => {
    socket.emit('host-deny-guest', { guestId });
  }, []);

  const mutePeer = useCallback((targetId: string) => {
    socket.emit('host-mute-peer', { targetId });
  }, []);

  const muteAllPeers = useCallback(() => {
    socket.emit('host-mute-all');
  }, []);

  const lowerAllHands = useCallback(() => {
    socket.emit('host-lower-all-hands');
  }, []);

  const transferHost = useCallback((targetId: string) => {
    socket.emit('host-transfer', { targetId });
  }, []);

  const removePeer = useCallback((targetId: string) => {
    socket.emit('host-remove-peer', { targetId });
  }, []);

  const endMeetingForAll = useCallback(() => {
    socket.emit('host-end-meeting');
  }, []);

  // ── Video Quality / Low-Internet Mode Switcher ───────────────────────────
  const setVideoQuality = useCallback(
    async (mode: VideoQualityMode) => {
      setVideoQualityMode(mode);
      videoQualityModeRef.current = mode;

      const camTrack = localCameraStreamRef.current?.getVideoTracks()[0];
      if (mode === 'audio-only') {
        if (camStateBeforeAudioOnlyRef.current === null) {
          camStateBeforeAudioOnlyRef.current = isCameraOffRef.current;
        }
        if (camTrack && !isCameraOffRef.current) {
          camTrack.enabled = false;
          setIsCameraOff(true);
          if (inCall) socket.emit('media-state-changed', { isCameraOff: true });
        }
        onMediaWarning?.('Audio-Only mode enabled (~32 kbps) for low internet.');
      } else {
        // Restore camera if it was active before switching to audio-only
        if (camStateBeforeAudioOnlyRef.current === false && camTrack && isCameraOffRef.current) {
          camTrack.enabled = true;
          setIsCameraOff(false);
          if (inCall) socket.emit('media-state-changed', { isCameraOff: false });
        }
        camStateBeforeAudioOnlyRef.current = null;
        if (mode === 'data-saver') {
          onMediaWarning?.('Data Saver active (~220 kbps, 360p @ 15fps).');
        }
      }

      const capKbps = await applyBitrateProfile(mode, networkStats.quality === 'poor');
      setNetworkStats((prev) => ({
        ...prev,
        activeCapKbps: capKbps,
        isThrottled: mode === 'data-saver' || mode === 'audio-only'
      }));
    },
    [applyBitrateProfile, inCall, networkStats.quality, onMediaWarning]
  );

  // ── Live WebRTC pc.getStats() Network Monitor (every 4s while in call) ──
  useEffect(() => {
    if (!inCall) {
      setNetworkStats(DEFAULT_NETWORK_STATS);
      return;
    }

    // Re-apply bitrate split whenever remote peer count changes
    applyBitrateProfile(videoQualityModeRef.current, false).then((capKbps) => {
      setNetworkStats((prev) => ({ ...prev, activeCapKbps: capKbps }));
    });

    let lastBytesSent = 0;
    let lastBytesRecv = 0;
    let lastSampleTime = Date.now();

    const intervalId = setInterval(async () => {
      if (peerConnectionsRef.current.size === 0) return;

      let highestRttMs: number | null = null;
      let totalPackets = 0;
      let totalLost = 0;
      let currBytesSent = 0;
      let currBytesRecv = 0;

      for (const pc of peerConnectionsRef.current.values()) {
        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (
              report.type === 'candidate-pair' &&
              report.state === 'succeeded' &&
              typeof report.currentRoundTripTime === 'number'
            ) {
              const rtt = Math.round(report.currentRoundTripTime * 1000);
              if (highestRttMs === null || rtt > highestRttMs) highestRttMs = rtt;
            }
            if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
              if (typeof report.packetsLost === 'number') totalLost += Math.max(0, report.packetsLost);
            }
            if (report.type === 'outbound-rtp') {
              if (report.kind === 'video' && typeof report.packetsSent === 'number') {
                totalPackets += report.packetsSent;
              }
              if (typeof report.bytesSent === 'number') currBytesSent += report.bytesSent;
            }
            if (report.type === 'inbound-rtp' && typeof report.bytesReceived === 'number') {
              currBytesRecv += report.bytesReceived;
            }
          });
        } catch {
          // ignore transient stats failure
        }
      }

      const now = Date.now();
      const elapsedSec = Math.max(1, (now - lastSampleTime) / 1000);
      const uploadKbps =
        lastBytesSent > 0 && currBytesSent >= lastBytesSent
          ? Math.round(((currBytesSent - lastBytesSent) * 8) / 1000 / elapsedSec)
          : 0;
      const downloadKbps =
        lastBytesRecv > 0 && currBytesRecv >= lastBytesRecv
          ? Math.round(((currBytesRecv - lastBytesRecv) * 8) / 1000 / elapsedSec)
          : 0;

      lastBytesSent = currBytesSent;
      lastBytesRecv = currBytesRecv;
      lastSampleTime = now;

      const lossPct =
        totalPackets + totalLost > 0
          ? Number(((totalLost / (totalPackets + totalLost)) * 100).toFixed(1))
          : 0;

      let quality: NetworkQuality = 'good';
      if ((highestRttMs !== null && highestRttMs > 420) || lossPct > 6) {
        quality = 'poor';
      } else if ((highestRttMs !== null && highestRttMs > 200) || lossPct > 2) {
        quality = 'fair';
      }

      const isPoor = quality === 'poor';
      const capKbps = await applyBitrateProfile(videoQualityModeRef.current, isPoor);

      setNetworkStats({
        quality,
        rttMs: highestRttMs,
        packetLossPct: lossPct,
        activeCapKbps: capKbps,
        uploadKbps,
        downloadKbps,
        isThrottled:
          videoQualityModeRef.current === 'data-saver' ||
          videoQualityModeRef.current === 'audio-only' ||
          (videoQualityModeRef.current === 'auto' && isPoor)
      });
    }, 4000);

    return () => clearInterval(intervalId);
  }, [inCall, remotePeers.length, applyBitrateProfile]);

  // Ensure all media tracks and peer connections close on unmount
  useEffect(() => {
    return () => {
      localCameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
    };
  }, []);

  return {
    inCall,
    lobbyStatus,
    lobbyMessage,
    roomId,
    selfId: socket.id || 'self',
    selfName,
    hostId,
    isHost,
    roomSettings,
    waitingList,
    isConnected,
    meetingStartedAt,
    videoQualityMode,
    networkStats,
    localStream: localDisplayStream,
    localCameraStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isHandRaised,
    remotePeers,
    messages,
    reactions,
    initLocalMedia,
    joinMeeting,
    leaveMeeting,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    toggleHandRaise,
    sendReaction,
    sendChatMessage,
    setVideoQuality,
    updateRoomSettings,
    admitGuest,
    admitAllGuests,
    denyGuest,
    mutePeer,
    muteAllPeers,
    lowerAllHands,
    transferHost,
    removePeer,
    endMeetingForAll
  };
}
