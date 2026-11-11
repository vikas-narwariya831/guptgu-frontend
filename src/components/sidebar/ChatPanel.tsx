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
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 bg-[#12161D]">
        {messages.length === 0 && (
          <div className="m-auto text-center text-xs text-neutral-500 px-6">
            Messages sent here are visible to everyone in the call.
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="self-center px-2.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-neutral-400 text-center"
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
                <span className="text-[10px] font-medium text-neutral-400 mb-0.5 ml-1">
                  {msg.senderName}
                </span>
              )}
              <div
                className={`px-3 py-2 rounded-xl text-xs break-words leading-relaxed ${
                  isMine
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-[#1D222B] text-neutral-100 rounded-bl-sm border border-white/[0.06]'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-neutral-500 mt-1 px-1">{msg.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {chatDisabled ? (
        <div className="p-3 border-t border-white/[0.07] bg-[#12161D] text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <Lock size={13} className="text-amber-400" />
          <span>Chat disabled by host</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.07] bg-[#161A22] flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message everyone..."
            className="flex-1 px-3 py-2 rounded-lg bg-[#101318] border border-white/[0.08] focus:border-white/25 text-xs text-neutral-100 placeholder-neutral-500 outline-none"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
            title="Send"
          >
            <Send size={14} />
          </button>
        </form>
      )}
    </>
  );
}

export default memo(ChatPanel);
