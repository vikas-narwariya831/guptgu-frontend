import type { FloatingReaction } from '../../types/meet';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export default function FloatingReactions({ reactions }: FloatingReactionsProps) {
  if (reactions.length === 0) return null;
  const visibleReactions = reactions.slice(-3);

  return (
    <div className="pointer-events-none fixed bottom-24 left-8 flex flex-col gap-2 z-30">
      {visibleReactions.map((r) => (
        <div
          key={r.id}
          className="animate-float-up flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C212B] border border-white/10"
        >
          <span className="text-xl">{r.emoji}</span>
          <span className="text-xs font-medium text-neutral-100">{r.senderName}</span>
        </div>
      ))}
    </div>
  );
}
