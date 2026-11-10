import { Ban, Check } from 'lucide-react';
import type { WaitingGuest } from '../../types/meet';

interface HostAdmitPopupProps {
  waitingList: WaitingGuest[];
  onAdmit: (guestId: string) => void;
  onDeny: (guestId: string) => void;
}

export default function HostAdmitPopup({
  waitingList,
  onAdmit,
  onDeny
}: HostAdmitPopupProps) {
  const firstGuest = waitingList[0];
  if (!firstGuest) return null;

  return (
    <div className="fixed top-18 right-5 z-40 w-80 p-4 rounded-2xl bg-white border border-[#CBE7D8] shadow-[0_16px_40px_-8px_rgba(17,24,39,0.16)] space-y-3">
      <div>
        <p className="text-xs font-bold text-[#0D6E4E]">Someone wants to join</p>
        <p className="text-sm font-semibold text-[#111827] mt-0.5 truncate">{firstGuest.name}</p>
        {waitingList.length > 1 && (
          <p className="text-[11px] text-[#6B7280]">+{waitingList.length - 1} more waiting</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDeny(firstGuest.id)}
          className="flex-1 py-2 rounded-xl bg-[#F3F5F3] hover:bg-rose-50 text-[#374151] hover:text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Ban size={13} /> Deny
        </button>
        <button
          type="button"
          onClick={() => onAdmit(firstGuest.id)}
          className="flex-1 py-2 rounded-xl bg-[#0D6E4E] hover:bg-[#0A573D] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check size={14} /> Admit
        </button>
      </div>
    </div>
  );
}
