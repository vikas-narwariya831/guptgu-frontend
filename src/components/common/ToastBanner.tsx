import { AlertCircle } from 'lucide-react';

interface ToastBannerProps {
  message: string;
  position?: 'lobby' | 'call';
}

export default function ToastBanner({ message, position = 'call' }: ToastBannerProps) {
  if (!message) return null;

  const topOffset = position === 'lobby' ? 'top-5' : 'top-16';

  return (
    <div
      className={`fixed ${topOffset} left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#E4E7E4] text-xs font-semibold text-[#111827] shadow-[0_8px_24px_-4px_rgba(17,24,39,0.12)]`}
    >
      <AlertCircle size={14} className="text-[#0D6E4E] shrink-0" />
      <span>{message}</span>
    </div>
  );
}
