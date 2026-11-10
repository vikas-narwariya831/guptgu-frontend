import { memo, useState, useRef, useEffect } from 'react';
import { Send, Lock } from 'lucide-react';
import type { ChatMessage } from '../../types/meet';

interface ChatPanelProps {
  messages: ChatMessage[];
  selfId: string;
  chatDisabled: boolean;
  onSendMessage: (text: string) => void;
}

function ChatPanel({
  messages,
  selfId,
  chatDisabled,
  onSendMessage
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || chatDisabled) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#FAFBF9]">
        {messages.length === 0 && (
          <div className="m-auto text-center text-xs text-[#9CA3AF] px-6">
            Messages sent here are visible to everyone in this Guptgu.
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="self-center px-3 py-1 rounded-full bg-[#ECEFED] text-[10px] font-medium text-[#4B5563] text-center"
              >
                {msg.text}
              </div>
            );
          }

          const isMine = msg.senderId === selfId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
            >
              {!isMine && (
                <span className="text-[10px] font-bold text-[#0D6E4E] mb-0.5 ml-1">
                  {msg.senderName}
                </span>
              )}
              <div
                className={`px-3.5 py-2 rounded-2xl text-xs break-words leading-relaxed shadow-2xs ${
                  isMine
                    ? 'bg-[#0D6E4E] text-white rounded-br-sm'
                    : 'bg-white text-[#111827] rounded-bl-sm border border-[#E4E7E4]'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-[#9CA3AF] mt-1 px-1">{msg.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {chatDisabled ? (
        <div className="p-3.5 border-t border-[#E6E9E6] bg-[#FAFBF9] text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
          <Lock size={13} className="text-amber-600" />
          <span>Chat is turned off by the host</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 border-t border-[#E6E9E6] bg-white flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message to everyone..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#E4E7E4] focus:bg-white focus:border-[#0D6E4E] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[#0D6E4E] hover:bg-[#0A573D] text-white transition-colors cursor-pointer shrink-0"
            title="Send"
          >
            <Send size={15} />
          </button>
        </form>
      )}
    </>
  );
}

export default memo(ChatPanel);
