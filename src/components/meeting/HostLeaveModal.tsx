import { PhoneOff, Power } from 'lucide-react';

interface HostLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJustLeave: () => void;
  onEndForAll: () => void;
}

export default function HostLeaveModal({
  isOpen,
  onClose,
  onJustLeave,
  onEndForAll
}: HostLeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#1A1F28] border border-white/10 p-5 space-y-4 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">Leave or end call?</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Leaving passes host to another participant. Ending closes the room for everyone.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onEndForAll}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Power size={14} /> End for everyone
          </button>
          <button
            type="button"
            onClick={onJustLeave}
            className="w-full py-2.5 rounded-xl bg-[#242B38] hover:bg-[#2E3646] text-neutral-100 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PhoneOff size={14} /> Just leave call
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
