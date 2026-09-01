import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServerOff, RefreshCw, ArrowLeft, Terminal } from "lucide-react";
import { useLocation } from "wouter";
import { checkServerHealth } from "@/lib/api";

interface ServerErrorPageProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ServerErrorPage({
  onRetry,
  title = "JOBLENS server unavailable.",
  description = "We couldn't connect to the local JOBLENS API server.",
}: ServerErrorPageProps) {
  const [, setLocation] = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    const ok = await checkServerHealth(3000);
    setIsRetrying(false);
    if (ok) {
      if (onRetry) onRetry();
      else window.location.reload();
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

        <div className="eyebrow text-[#e7684a] mb-2">BACKEND DISCONNECTED</div>
        <h1 className="font-display text-4xl tracking-[-.05em] text-[#16263b] mb-3">
          {title}
        </h1>

        <p className="text-sm leading-6 text-[#657180] mb-5">
          {description}
        </p>

        {/* HELPFUL COMMAND TIP */}
        <div className="mb-6 rounded-xl border border-[#ded5c5] bg-[#f6f1e7] p-4 text-left text-xs font-mono text-[#16263b] flex items-start gap-3">
          <Terminal size={16} className="text-[#e7684a] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold font-sans text-[#657180] mb-1">Make sure backend is running:</div>
            <code>pnpm dev</code>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-12 w-full rounded-full bg-[#16263b] text-sm font-bold text-[#fffaf2] shadow-[4px_4px_0_#e7684a] hover:bg-[#263b55] transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />
            {isRetrying ? "Checking server..." : "Retry Connection"}
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
