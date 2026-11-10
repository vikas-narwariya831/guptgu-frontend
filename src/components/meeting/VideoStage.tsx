import { UserPlus, Copy, Check } from 'lucide-react';
import type { PeerInfo } from '../../types/meet';
import VideoTile from './VideoTile';

interface VideoStageProps {
  peers: PeerInfo[];
  selfId: string;
  pinnedPeerId: string | null;
  copied: boolean;
  onTogglePin: (peerId: string) => void;
  onCopyInvite: () => void;
}

export default function VideoStage({
  peers,
  selfId,
  pinnedPeerId,
  copied,
  onTogglePin,
  onCopyInvite
}: VideoStageProps) {
  const presenter = peers.find((p) => p.isScreenSharing);
  const spotlightPeer =
    peers.find((p) => p.id === pinnedPeerId) || (peers.length > 1 ? presenter : undefined);
  const stripPeers = spotlightPeer ? peers.filter((p) => p.id !== spotlightPeer.id) : [];

  const gridColsClass =
    peers.length === 1
      ? 'grid-cols-1 max-w-4xl max-h-[600px] my-auto mx-auto'
      : peers.length === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[540px] my-auto mx-auto'
      : peers.length <= 4
      ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto'
      : 'grid-cols-2 lg:grid-cols-3';

  if (spotlightPeer) {
    return (
      <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0">
        <div className="flex-1 min-h-0">
          <VideoTile
            name={spotlightPeer.name}
            stream={spotlightPeer.stream || null}
            isLocal={spotlightPeer.id === selfId}
            isMuted={spotlightPeer.isMuted}
            isCameraOff={spotlightPeer.isCameraOff}
            isScreenSharing={spotlightPeer.isScreenSharing}
            isHandRaised={spotlightPeer.isHandRaised}
            isHost={spotlightPeer.isHost}
            isPinned={pinnedPeerId === spotlightPeer.id}
            onTogglePin={() => onTogglePin(spotlightPeer.id)}
          />
        </div>

        {stripPeers.length > 0 && (
          <div className="lg:w-64 xl:w-72 shrink-0 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto">
            {stripPeers.map((peer) => (
              <div key={peer.id} className="w-48 lg:w-full h-36 lg:h-44 shrink-0">
                <VideoTile
                  name={peer.name}
                  stream={peer.stream || null}
                  isLocal={peer.id === selfId}
                  isMuted={peer.isMuted}
                  isCameraOff={peer.isCameraOff}
                  isScreenSharing={peer.isScreenSharing}
                  isHandRaised={peer.isHandRaised}
                  isHost={peer.isHost}
                  isPinned={false}
                  onTogglePin={() => onTogglePin(peer.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex min-h-0">
      <div className={`grid ${gridColsClass} gap-3.5 w-full h-full auto-rows-fr`}>
        {peers.map((peer) => (
          <VideoTile
            key={peer.id}
            name={peer.name}
            stream={peer.stream || null}
            isLocal={peer.id === selfId}
            isMuted={peer.isMuted}
            isCameraOff={peer.isCameraOff}
            isScreenSharing={peer.isScreenSharing}
            isHandRaised={peer.isHandRaised}
            isHost={peer.isHost}
            isPinned={false}
            onTogglePin={peers.length > 1 ? () => onTogglePin(peer.id) : undefined}
          />
        ))}
      </div>

      {peers.length === 1 && (
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E4E7E4] shadow-[0_8px_24px_-4px_rgba(17,24,39,0.1)] absolute bottom-3 right-3 z-10">
          <div className="w-8 h-8 rounded-xl bg-[#EDF7F2] border border-[#CBE7D8] flex items-center justify-center text-[#0D6E4E] shrink-0">
            <UserPlus size={15} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#111827]">You&apos;re the only one here</p>
            <p className="text-[11px] text-[#6B7280]">Share Guptgu link to invite others</p>
          </div>
          <button
            type="button"
            onClick={onCopyInvite}
            className="ml-2 px-3 py-1.5 rounded-xl bg-[#0D6E4E] hover:bg-[#0A573D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
