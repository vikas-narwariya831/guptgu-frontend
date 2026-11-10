import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { useMeetingShortcuts } from './hooks/useMeetingShortcuts';
import { useNetworkSpeed } from './hooks/useNetworkSpeed';
import ToastBanner from './components/common/ToastBanner';
import LobbyScreen from './components/lobby/LobbyScreen';
import MeetingHeader from './components/meeting/MeetingHeader';
import VideoStage from './components/meeting/VideoStage';
import FloatingReactions from './components/meeting/FloatingReactions';
import HostAdmitPopup from './components/meeting/HostAdmitPopup';
import HostLeaveModal from './components/meeting/HostLeaveModal';
import ControlBar from './components/meeting/ControlBar';
import SidebarDrawer from './components/sidebar/SidebarDrawer';
import type { ActiveSidebar, PeerInfo } from './types/meet';

export default function App() {
  const [toast, setToast] = useState('');
  const [activeSidebar, setActiveSidebar] = useState<ActiveSidebar>('none');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHostLeaveModal, setShowHostLeaveModal] = useState(false);

  const initialRoomCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room')?.trim() || '';
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? '' : curr)), 4000);
  }, []);

  const webrtc = useWebRTC({
    onMediaWarning: showToast,
    onRoomError: showToast
  });

  const webSpeed = useNetworkSpeed(webrtc.inCall && webrtc.remotePeers.length > 0);

  useMeetingShortcuts({
    enabled: webrtc.inCall,
    onToggleMute: webrtc.toggleMute,
    onToggleCamera: webrtc.toggleCamera
  });

  useEffect(() => {
    if (!webrtc.inCall) setShowHostLeaveModal(false);
  }, [webrtc.inCall]);

  useEffect(() => {
    if (activeSidebar === 'chat') {
      setUnreadCount(0);
    } else if (webrtc.messages.length > 0) {
      const latest = webrtc.messages[webrtc.messages.length - 1];
      if (!latest.isSystem && latest.senderId !== webrtc.selfId) {
        setUnreadCount((c) => c + 1);
      }
    }
  }, [webrtc.messages, activeSidebar, webrtc.selfId]);

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/?room=${webrtc.roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Meeting link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSidebar = (panel: 'chat' | 'participants' | 'host') => {
    setActiveSidebar((prev) => (prev === panel ? 'none' : panel));
  };

  const handleLeaveClick = () => {
    if (webrtc.isHost && webrtc.remotePeers.length > 0) {
      setShowHostLeaveModal(true);
    } else {
      webrtc.leaveMeeting();
    }
  };

  if (!webrtc.inCall) {
    return (
      <>
        <LobbyScreen
          initialRoomCode={initialRoomCode}
          lobbyStatus={webrtc.lobbyStatus}
          lobbyMessage={webrtc.lobbyMessage}
          localStream={webrtc.localStream}
          isMuted={webrtc.isMuted}
          isCameraOff={webrtc.isCameraOff}
          isConnected={webrtc.isConnected}
          webSpeed={webSpeed}
          onInitMedia={webrtc.initLocalMedia}
          onToggleMute={webrtc.toggleMute}
          onToggleCamera={webrtc.toggleCamera}
          onJoinMeeting={webrtc.joinMeeting}
        />
        <ToastBanner message={toast} position="lobby" />
      </>
    );
  }

  const selfPeer: PeerInfo = {
    id: webrtc.selfId,
    name: webrtc.selfName || 'You',
    isMuted: webrtc.isMuted,
    isCameraOff: webrtc.isCameraOff,
    isScreenSharing: webrtc.isScreenSharing,
    isHandRaised: webrtc.isHandRaised,
    isHost: webrtc.isHost,
    stream: webrtc.localStream
  };

  const allPeers = [selfPeer, ...webrtc.remotePeers];

  return (
    <div className="h-screen w-screen bg-[#FAFBF9] text-[#111827] flex flex-col overflow-hidden relative select-none">
      <MeetingHeader
        roomId={webrtc.roomId}
        copied={copied}
        isLocked={webrtc.roomSettings.isLocked}
        isHost={webrtc.isHost}
        participantCount={allPeers.length}
        meetingStartedAt={webrtc.meetingStartedAt}
        videoQualityMode={webrtc.videoQualityMode}
        networkStats={webrtc.networkStats}
        webSpeed={webSpeed}
        onCopyInvite={handleCopyInvite}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 p-3 sm:p-4 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          <VideoStage
            peers={allPeers}
            selfId={webrtc.selfId}
            pinnedPeerId={pinnedPeerId}
            copied={copied}
            onTogglePin={(id) => setPinnedPeerId((prev) => (prev === id ? null : id))}
            onCopyInvite={handleCopyInvite}
          />

          <FloatingReactions reactions={webrtc.reactions} />

          {webrtc.isHost && (
            <HostAdmitPopup
              waitingList={webrtc.waitingList}
              onAdmit={webrtc.admitGuest}
              onDeny={webrtc.denyGuest}
            />
          )}
        </main>

        <SidebarDrawer
          activeTab={activeSidebar}
          onClose={() => setActiveSidebar('none')}
          onSwitchTab={setActiveSidebar}
          messages={webrtc.messages}
          selfId={webrtc.selfId}
          isHost={webrtc.isHost}
          selfPeer={selfPeer}
          remotePeers={webrtc.remotePeers}
          waitingList={webrtc.waitingList}
          roomSettings={webrtc.roomSettings}
          onSendMessage={webrtc.sendChatMessage}
          onUpdateSettings={webrtc.updateRoomSettings}
          onAdmitGuest={webrtc.admitGuest}
          onAdmitAll={webrtc.admitAllGuests}
          onDenyGuest={webrtc.denyGuest}
          onMutePeer={webrtc.mutePeer}
          onMuteAll={webrtc.muteAllPeers}
          onLowerAllHands={webrtc.lowerAllHands}
          onTransferHost={webrtc.transferHost}
          onRemovePeer={webrtc.removePeer}
          onEndMeetingForAll={webrtc.endMeetingForAll}
        />
      </div>

      <ControlBar
        isHost={webrtc.isHost}
        roomSettings={webrtc.roomSettings}
        waitingCount={webrtc.waitingList.length}
        isMuted={webrtc.isMuted}
        isCameraOff={webrtc.isCameraOff}
        isScreenSharing={webrtc.isScreenSharing}
        isHandRaised={webrtc.isHandRaised}
        activeSidebar={activeSidebar}
        unreadCount={unreadCount}
        participantCount={allPeers.length}
        copied={copied}
        videoQualityMode={webrtc.videoQualityMode}
        networkStats={webrtc.networkStats}
        webSpeed={webSpeed}
        onSelectQuality={webrtc.setVideoQuality}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
        onToggleScreenShare={webrtc.toggleScreenShare}
        onToggleHandRaise={webrtc.toggleHandRaise}
        onSendReaction={webrtc.sendReaction}
        onToggleSidebar={handleToggleSidebar}
        onCopyLink={handleCopyInvite}
        onLeave={handleLeaveClick}
      />

      <HostLeaveModal
        isOpen={showHostLeaveModal}
        onClose={() => setShowHostLeaveModal(false)}
        onJustLeave={() => {
          setShowHostLeaveModal(false);
          webrtc.leaveMeeting();
        }}
        onEndForAll={() => {
          setShowHostLeaveModal(false);
          webrtc.endMeetingForAll();
        }}
      />

      <ToastBanner message={toast} position="call" />
    </div>
  );
}
