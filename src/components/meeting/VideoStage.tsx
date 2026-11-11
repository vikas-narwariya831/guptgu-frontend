import { memo } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';
import type { PeerInfo } from '../../types/meet';
import VideoTile from './VideoTile';

interface VideoStageProps {
  peers: PeerInfo[];
  selfId: string;
  pinnedPeerId: string | null;
  copied: boolean;
  liteMode?: boolean;
  onTogglePin: (peerId: string) => void;
  onCopyInvite: () => void;
}

function VideoStage({
  peers,
  selfId,
  pinnedPeerId,
  copied,
  liteMode = false,
  onTogglePin,
  onCopyInvite
}: VideoStageProps) {
  const presenter = peers.find((p) => p.isScreenSharing);
  const spotlightPeer =
    peers.find((p) => p.id === pinnedPeerId) || (peers.length > 1 ? presenter : undefined);
  const stripPeers = spotlightPeer ? peers.filter((p) => p.id !== spotlightPeer.id) : [];

  const gridColsClass =
    peers.length === 1
      ? 'grid-cols-1 max-w-4xl md:max-h-[600px] my-auto mx-auto'
      : peers.length === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-6xl md:max-h-[540px] my-auto mx-auto'
      : peers.length <= 4
      ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto'
      : 'grid-cols-2 lg:grid-cols-3';

  if (spotlightPeer) {
    return (
      <div className="flex-1 flex flex-col lg:flex-row gap-2.5 sm:gap-3.5 min-h-0">
        <div className="flex-1 min-h-[240px]">
          <VideoTile
            peerId={spotlightPeer.id}
            name={spotlightPeer.name}
            stream={spotlightPeer.stream || null}
            isLocal={spotlightPeer.id === selfId}
            isMuted={spotlightPeer.isMuted}
            isCameraOff={spotlightPeer.isCameraOff}
            isScreenSharing={spotlightPeer.isScreenSharing}
            isHandRaised={spotlightPeer.isHandRaised}
            isHost={spotlightPeer.isHost}
            isPinned={pinnedPeerId === spotlightPeer.id}
            liteMode={liteMode}
            disableVideoDecoder={false}
            onTogglePin={onTogglePin}
          />
        </div>

        {stripPeers.length > 0 && (
          <div className="lg:w-64 xl:w-72 shrink-0 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto pb-1 lg:pb-0">
            {stripPeers.map((peer) => (
              <div key={peer.id} className="w-36 sm:w-48 lg:w-full h-28 sm:h-36 lg:h-44 shrink-0">
                <VideoTile
                  peerId={peer.id}
                  name={peer.name}
                  stream={peer.stream || null}
                  isLocal={peer.id === selfId}
                  isMuted={peer.isMuted}
                  isCameraOff={peer.isCameraOff}
                  isScreenSharing={peer.isScreenSharing}
                  isHandRaised={peer.isHandRaised}
                  isHost={peer.isHost}
                  isPinned={false}
                  liteMode={liteMode}
                  disableVideoDecoder={liteMode}
                  onTogglePin={onTogglePin}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  let activeLiteRemoteDecoders = 0;

  return (
    <div className="relative flex-1 flex min-h-0">
      <div className={`grid ${gridColsClass} gap-3 sm:gap-3.5 w-full h-full auto-rows-fr`}>
        {peers.map((peer) => {
          const isLocal = peer.id === selfId;
          let disableDecoder = false;

          if (liteMode) {
            if (isLocal && peers.length > 2) {
              // Pause local mirror preview when 3+ people are in grid to free a hardware decoder
              disableDecoder = true;
            } else if (!isLocal && !peer.isCameraOff && peer.stream) {
              activeLiteRemoteDecoders += 1;
              // Budget 2GB mobile GPUs handle up to 2 simultaneous live remote video surfaces smoothly
              if (activeLiteRemoteDecoders > 2) {
                disableDecoder = true;
              }
            }
          }

          return (
            <VideoTile
              key={peer.id}
              peerId={peer.id}
              name={peer.name}
              stream={peer.stream || null}
              isLocal={isLocal}
              isMuted={peer.isMuted}
              isCameraOff={peer.isCameraOff}
              isScreenSharing={peer.isScreenSharing}
              isHandRaised={peer.isHandRaised}
              isHost={peer.isHost}
              isPinned={false}
              liteMode={liteMode}
              disableVideoDecoder={disableDecoder}
              onTogglePin={peers.length > 1 ? onTogglePin : undefined}
            />
          );
        })}
      </div>

      {peers.length === 1 && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#161A22] border border-white/10 absolute bottom-2 right-2 left-2 sm:left-auto sm:bottom-3 sm:right-3 z-10">
          <div className="w-8 h-8 rounded-lg bg-[#222834] flex items-center justify-center text-neutral-300 shrink-0">
            <UserPlus size={15} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-100 truncate">Waiting for others</p>
            <p className="text-[11px] text-neutral-400 truncate">Share invite link</p>
          </div>
          <button
            type="button"
            onClick={onCopyInvite}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(VideoStage);
