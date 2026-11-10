export interface PeerInfo {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isHost?: boolean;
  stream?: MediaStream | null;
}

export interface RoomSettings {
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowUnmute: boolean;
}

export interface WaitingGuest {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  requestedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  peerId: string;
  senderName: string;
  emoji: string;
}

export type ActiveSidebar = 'none' | 'chat' | 'participants' | 'host';

export type LobbyStatus = 'idle' | 'waiting' | 'rejected';

export type VideoQualityMode = 'auto' | 'hd' | 'data-saver' | 'audio-only';

export type NetworkQuality = 'good' | 'fair' | 'poor';

export interface NetworkStats {
  quality: NetworkQuality;
  rttMs: number | null;
  packetLossPct: number;
  activeCapKbps: number;
  uploadKbps: number;
  downloadKbps: number;
  isThrottled: boolean;
}
