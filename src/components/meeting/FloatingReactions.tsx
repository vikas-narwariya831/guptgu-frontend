import type { FloatingReaction } from '../../types/meet';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export default function FloatingReactions({ reactions }: FloatingReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-8 flex flex-col gap-2 z-30">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="animate-float-up flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E4E7E4] shadow-lg"
        >
          <span className="text-2xl">{r.emoji}</span>
          <span className="text-xs font-semibold text-[#111827]">{r.senderName}</span>
        </div>
      ))}
    </div>
  );
}
