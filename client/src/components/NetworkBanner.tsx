import { useEffect, useState } from "react";
import { WifiOff, CheckCircle2, X } from "lucide-react";

export function NetworkBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState(false);
  const [dismissedOffline, setDismissedOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissedOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      setDismissedOffline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showRestored) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#668f7b] px-4 py-3 text-xs font-bold text-white shadow-xl animate-rise">
        <CheckCircle2 size={16} />
        <span>Connection restored. You're back online.</span>
      </div>
    );
  }

  if (!isOnline && !dismissedOffline) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#16263b] border border-[#e7684a] px-4 py-3 text-xs font-semibold text-[#fffaf2] shadow-xl animate-rise">
        <WifiOff size={16} className="text-[#e7684a]" />
        <span>You're offline — local features remain available.</span>
        <button
          onClick={() => setDismissedOffline(true)}
          className="ml-2 text-xs text-[#aab5bf] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
}
