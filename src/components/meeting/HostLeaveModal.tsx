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
      className="fixed inset-0 z-50 bg-[#111827]/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-[#E4E7E4] p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[#111827]">Leave or end the Guptgu?</h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Leaving transfers host controls to another participant. Ending closes the room for everyone.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onEndForAll}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Power size={15} /> End Meeting for Everyone
          </button>
          <button
            type="button"
            onClick={onJustLeave}
            className="w-full py-3 rounded-xl bg-[#F3F5F3] hover:bg-[#EDF7F2] text-[#111827] hover:text-[#0D6E4E] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PhoneOff size={15} /> Just Leave the Call
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
