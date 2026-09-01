import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServerOff, RefreshCw, ArrowLeft, Terminal } from "lucide-react";
import { useLocation } from "wouter";
import { checkServerHealth, isLocalDev } from "@/lib/api";
import { toast } from "sonner";

interface ServerErrorPageProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ServerErrorPage({
  onRetry,
  title,
  description,
}: ServerErrorPageProps) {
  const [, setLocation] = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);

  const localMode = isLocalDev();

  const displayTitle =
    title ||
    (localMode
      ? "JOBLENS server unavailable."
      : "JOBLENS Service Unavailable");

  const displayDescription =
    description ||
    (localMode
      ? "We couldn't connect to the local JOBLENS API server."
      : "The JOBLENS API service is temporarily unreachable. Please check your network connection or try again shortly.");

  const eyebrowText = localMode ? "BACKEND DISCONNECTED" : "SERVICE TEMPORARILY UNAVAILABLE";

  const handleRetry = async () => {
    setIsRetrying(true);
    const ok = await checkServerHealth(3000);
    setIsRetrying(false);
    if (ok) {
      toast.success("Connected to JOBLENS server!");
      if (onRetry) onRetry();
      else window.location.reload();
    } else {
      toast.error(
        localMode
          ? "JOBLENS server is still unreachable. Please verify pnpm dev is running."
          : "JOBLENS service is still unreachable. Please try again in a moment."
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f6f1e7] p-6 text-[#16263b] animate-rise">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[#ded5c5] bg-[#fffdf8] p-8 md:p-10 shadow-xl text-center">
        {/* BRANDING */}
        <div className="flex justify-center mb-6">
          <div className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-[#e7684a] bg-[#16263b] shadow-[4px_4px_0_#e7684a]">
            <img src="/assets/joblens-mark.svg" alt="JOBLENS" className="h-7 w-7 object-contain" />
          </div>
        </div>

        {/* ICON */}
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#fff5ef] border border-[#f9ddd6] text-[#e7684a]">
          <ServerOff size={32} />
        </div>

        <div className="eyebrow text-[#e7684a] mb-2">{eyebrowText}</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-[-.05em] text-[#16263b] mb-3">
          {displayTitle}
        </h1>

        <p className="text-sm leading-6 text-[#657180] mb-5">
          {displayDescription}
        </p>

        {/* HELPFUL COMMAND TIP: Only display in local development */}
        {localMode && (
          <div className="mb-6 rounded-xl border border-[#ded5c5] bg-[#f6f1e7] p-4 text-left text-xs font-mono text-[#16263b] flex items-start gap-3">
            <Terminal size={16} className="text-[#e7684a] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-sans text-[#657180] mb-1">Make sure backend is running:</div>
              <code>pnpm dev</code>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-12 w-full rounded-full bg-[#16263b] text-sm font-bold text-[#fffaf2] shadow-[4px_4px_0_#e7684a] hover:bg-[#263b55] transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />
            {isRetrying ? "Checking service..." : "Retry Connection"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/")}
            className="h-11 w-full rounded-full border-[#ded5c5] bg-transparent text-sm font-bold text-[#657180] hover:bg-[#f6f1e7] flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
