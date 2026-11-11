import { X, ShieldCheck } from 'lucide-react';
import type {
  ActiveSidebar,
  ChatMessage,
  PeerInfo,
  RoomSettings,
  WaitingGuest
} from '../../types/meet';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import HostControlsPanel from './HostControlsPanel';

interface SidebarDrawerProps {
  activeTab: ActiveSidebar;
  onClose: () => void;
  onSwitchTab: (tab: 'chat' | 'participants' | 'host') => void;
  messages: ChatMessage[];
  selfId: string;
  isHost: boolean;
  selfPeer: PeerInfo;
  remotePeers: PeerInfo[];
  waitingList: WaitingGuest[];
  roomSettings: RoomSettings;
  onSendMessage: (text: string) => void;
  onUpdateSettings: (partial: Partial<RoomSettings>) => void;
  onAdmitGuest: (guestId: string) => void;
  onAdmitAll: () => void;
  onDenyGuest: (guestId: string) => void;
  onMutePeer: (peerId: string) => void;
  onMuteAll: () => void;
  onLowerAllHands: () => void;
  onTransferHost: (peerId: string) => void;
  onRemovePeer: (peerId: string) => void;
  onEndMeetingForAll: () => void;
}

export default function SidebarDrawer({
  activeTab,
  onClose,
  onSwitchTab,
  messages,
  selfId,
  isHost,
  selfPeer,
  remotePeers,
  waitingList,
  roomSettings,
  onSendMessage,
  onUpdateSettings,
  onAdmitGuest,
  onAdmitAll,
  onDenyGuest,
  onMutePeer,
  onMuteAll,
  onLowerAllHands,
  onTransferHost,
  onRemovePeer,
  onEndMeetingForAll
}: SidebarDrawerProps) {
  if (activeTab === 'none') return null;

  const allParticipants = [selfPeer, ...remotePeers];

  return (
    <aside className="w-full sm:w-80 md:w-88 shrink-0 h-full sm:h-auto sm:my-3 sm:mr-3 sm:rounded-xl bg-[#161A22] border border-white/[0.08] text-neutral-100 flex flex-col z-40 fixed sm:static inset-0 sm:inset-auto overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.07] gap-2">
        <div className="flex items-center gap-1 bg-[#101318] p-1 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => onSwitchTab('chat')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-[#232936] text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('participants')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'participants'
                ? 'bg-[#232936] text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>People ({allParticipants.length})</span>
            {isHost && waitingList.length > 0 && (
              <span className="px-1.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold">
                +{waitingList.length}
              </span>
            )}
          </button>
          {isHost && (
            <button
              type="button"
              onClick={() => onSwitchTab('host')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'host'
                  ? 'bg-[#232936] text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShieldCheck size={12} />
              <span>Host</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
        >
          <X size={17} />
        </button>
      </div>

      {activeTab === 'chat' && (
        <ChatPanel
          messages={messages}
          selfId={selfId}
          chatDisabled={!isHost && !roomSettings.allowChat}
          onSendMessage={onSendMessage}
        />
      )}

      {activeTab === 'participants' && (
        <ParticipantsPanel
          selfId={selfId}
          isHost={isHost}
          participants={allParticipants}
          waitingList={waitingList}
          onAdmitGuest={onAdmitGuest}
          onAdmitAll={onAdmitAll}
          onDenyGuest={onDenyGuest}
          onMutePeer={onMutePeer}
          onMuteAll={onMuteAll}
          onLowerAllHands={onLowerAllHands}
          onTransferHost={onTransferHost}
          onRemovePeer={onRemovePeer}
        />
      )}

      {activeTab === 'host' && isHost && (
        <HostControlsPanel
          roomSettings={roomSettings}
          onUpdateSettings={onUpdateSettings}
          onMuteAll={onMuteAll}
          onEndMeetingForAll={onEndMeetingForAll}
        />
      )}
    </aside>
  );
}
