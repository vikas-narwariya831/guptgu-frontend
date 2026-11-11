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
    <div className="fixed top-15 left-3 right-3 sm:left-auto sm:right-5 z-40 sm:w-80 p-3.5 rounded-xl bg-[#1A1F28] border border-white/12 text-neutral-100 space-y-3">
      <div>
        <p className="text-[11px] font-medium text-emerald-400">Someone wants to join</p>
        <p className="text-sm font-semibold text-white mt-0.5 truncate">{firstGuest.name}</p>
        {waitingList.length > 1 && (
          <p className="text-[11px] text-neutral-400">+{waitingList.length - 1} more waiting</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDeny(firstGuest.id)}
          className="flex-1 py-2 rounded-lg bg-[#242B38] hover:bg-rose-500/20 text-neutral-200 hover:text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Ban size={13} /> Deny
        </button>
        <button
          type="button"
          onClick={() => onAdmit(firstGuest.id)}
          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check size={14} /> Admit
        </button>
      </div>
    </div>
  );
}
