import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { useMeetingShortcuts } from './hooks/useMeetingShortcuts';
import { useNetworkSpeed } from './hooks/useNetworkSpeed';
import ToastBanner from './components/common/ToastBanner';
import LobbyScreen from './components/lobby/LobbyScreen';
import MeetingHeader from './components/meeting/MeetingHeader';
import VideoStage from './components/meeting/VideoStage';
import FloatingReactions from './components/meeting/FloatingReactions';
import ControlBar from './components/meeting/ControlBar';
import type { ActiveSidebar, PeerInfo } from './types/meet';

// Lazy-load panels & modals so 2GB RAM phones only allocate them when opened
const HostAdmitPopup = lazy(() => import('./components/meeting/HostAdmitPopup'));
const HostLeaveModal = lazy(() => import('./components/meeting/HostLeaveModal'));
const SidebarDrawer = lazy(() => import('./components/sidebar/SidebarDrawer'));

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

  const handleCopyInvite = useCallback(() => {
    const url = `${window.location.origin}/?room=${webrtc.roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Meeting link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [webrtc.roomId, showToast]);

  const handleToggleSidebar = useCallback((panel: 'chat' | 'participants' | 'host') => {
    setActiveSidebar((prev) => (prev === panel ? 'none' : panel));
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setPinnedPeerId((prev) => (prev === id ? null : id));
  }, []);

  const handleLeaveClick = useCallback(() => {
    if (webrtc.isHost && webrtc.remotePeers.length > 0) {
      setShowHostLeaveModal(true);
    } else {
      webrtc.leaveMeeting();
    }
  }, [webrtc.isHost, webrtc.remotePeers.length, webrtc.leaveMeeting]);

  const selfPeer: PeerInfo = useMemo(
    () => ({
      id: webrtc.selfId,
      name: webrtc.selfName || 'You',
      isMuted: webrtc.isMuted,
      isCameraOff: webrtc.isCameraOff,
      isScreenSharing: webrtc.isScreenSharing,
      isHandRaised: webrtc.isHandRaised,
      isHost: webrtc.isHost,
      stream: webrtc.localStream
    }),
    [
      webrtc.selfId,
      webrtc.selfName,
      webrtc.isMuted,
      webrtc.isCameraOff,
      webrtc.isScreenSharing,
      webrtc.isHandRaised,
      webrtc.isHost,
      webrtc.localStream
    ]
  );

  const allPeers = useMemo(
    () => [selfPeer, ...webrtc.remotePeers],
    [selfPeer, webrtc.remotePeers]
  );

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
          liteMode={webrtc.liteMode}
          webSpeed={webSpeed}
          onInitMedia={webrtc.initLocalMedia}
          onToggleMute={webrtc.toggleMute}
          onToggleCamera={webrtc.toggleCamera}
          onToggleLiteMode={webrtc.setLiteMode}
          onJoinMeeting={webrtc.joinMeeting}
        />
        <ToastBanner message={toast} position="lobby" />
      </>
    );
  }

  return (
    <div className="h-dvh w-full bg-[#0E1116] text-neutral-100 flex flex-col overflow-hidden relative select-none">
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
        <main className="flex-1 p-2.5 sm:p-4 flex flex-col min-w-0 min-h-0 overflow-y-auto md:overflow-hidden relative">
          <VideoStage
            peers={allPeers}
            selfId={webrtc.selfId}
            pinnedPeerId={pinnedPeerId}
            copied={copied}
            liteMode={webrtc.liteMode}
            onTogglePin={handleTogglePin}
            onCopyInvite={handleCopyInvite}
          />

          <FloatingReactions reactions={webrtc.reactions} />

          {webrtc.isHost && webrtc.waitingList.length > 0 && (
            <Suspense fallback={null}>
              <HostAdmitPopup
                waitingList={webrtc.waitingList}
                onAdmit={webrtc.admitGuest}
                onDeny={webrtc.denyGuest}
              />
            </Suspense>
          )}
        </main>

        {activeSidebar !== 'none' && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}
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
        liteMode={webrtc.liteMode}
        deviceMemoryGb={webrtc.deviceMemoryGb}
        videoQualityMode={webrtc.videoQualityMode}
        networkStats={webrtc.networkStats}
        webSpeed={webSpeed}
        onSelectQuality={webrtc.setVideoQuality}
        onToggleLiteMode={webrtc.setLiteMode}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
        onToggleScreenShare={webrtc.toggleScreenShare}
        onToggleHandRaise={webrtc.toggleHandRaise}
        onSendReaction={webrtc.sendReaction}
        onToggleSidebar={handleToggleSidebar}
        onCopyLink={handleCopyInvite}
        onLeave={handleLeaveClick}
      />

      {showHostLeaveModal && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      <ToastBanner message={toast} position="call" />
    </div>
  );
}
