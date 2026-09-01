import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

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
          <Compass size={32} />
        </div>

        <div className="eyebrow text-[#e7684a] mb-2">404 ERROR</div>
        <h1 className="font-display text-4xl tracking-[-.05em] text-[#16263b] mb-3">
          Page not found.
        </h1>

        <p className="text-sm leading-6 text-[#657180] mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setLocation("/")}
            className="h-12 w-full rounded-full bg-[#16263b] text-sm font-bold text-[#fffaf2] shadow-[4px_4px_0_#e7684a] hover:bg-[#263b55] transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back to JOBLENS
          </Button>
        </div>
      </div>
    </div>
  );
}
