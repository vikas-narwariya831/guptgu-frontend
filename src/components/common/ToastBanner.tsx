import { AlertCircle } from 'lucide-react';

interface ToastBannerProps {
  message: string;
  position?: 'lobby' | 'call';
}

export default function ToastBanner({ message, position = 'call' }: ToastBannerProps) {
  if (!message) return null;

  const isLobby = position === 'lobby';
  const topOffset = isLobby ? 'top-5' : 'top-15';

  return (
    <div
      className={`fixed ${topOffset} left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium max-w-[calc(100vw-24px)] ${
        isLobby
          ? 'bg-[#14171A] text-white'
          : 'bg-[#1D222B] text-neutral-100 border border-white/10'
      }`}
    >
      <AlertCircle size={13} className="text-emerald-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
