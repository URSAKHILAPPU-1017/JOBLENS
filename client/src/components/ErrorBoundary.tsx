import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[JOBLENS React Error Boundary Caught]", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f6f1e7] p-6 text-[#16263b]">
          <div className="w-full max-w-md rounded-[1.8rem] border border-[#ded5c5] bg-[#fffdf8] p-8 md:p-10 shadow-xl text-center">
            {/* BRANDING */}
            <div className="flex justify-center mb-6">
              <div className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-[#e7684a] bg-[#16263b] shadow-[4px_4px_0_#e7684a]">
                <img src="/assets/joblens-mark.svg" alt="JOBLENS" className="h-7 w-7 object-contain" />
              </div>
            </div>

            {/* ICON */}
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#fff5ef] border border-[#f9ddd6] text-[#e7684a]">
              <AlertOctagon size={32} />
            </div>

            <div className="eyebrow text-[#e7684a] mb-2">APPLICATION EXCEPTION</div>
            <h1 className="font-display text-4xl tracking-[-.05em] text-[#16263b] mb-3">
              Something went wrong.
            </h1>

            <p className="text-sm leading-6 text-[#657180] mb-8">
              An unexpected application error occurred. You can try recovering or return to the main workspace.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="h-12 w-full rounded-full bg-[#16263b] text-sm font-bold text-[#fffaf2] shadow-[4px_4px_0_#e7684a] hover:bg-[#263b55] transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Try Again
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
                className="h-11 w-full rounded-full border-[#ded5c5] bg-transparent text-sm font-bold text-[#657180] hover:bg-[#f6f1e7] flex items-center justify-center gap-2"
              >
                <Home size={16} /> Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
