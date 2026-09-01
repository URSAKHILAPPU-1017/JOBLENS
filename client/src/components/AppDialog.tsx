import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AppDialog({ open, onOpenChange, title, description, children }: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#f6f1e7] text-[#16263b] rounded-[1.5rem] border border-[#ded5c5] p-6 shadow-2xl">
        <DialogHeader>
          <div className="eyebrow text-[#e7684a]">JOBLENS ASSISTANT</div>
          <DialogTitle className="font-display text-2xl tracking-[-.04em] text-[#16263b] mt-1">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#657180] mt-2 leading-6">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children && <div className="mt-4">{children}</div>}

        <DialogFooter className="mt-6 border-t border-[#ded5c5] pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-full bg-[#16263b] text-sm font-bold text-[#fffaf2] hover:bg-[#263b55]"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
