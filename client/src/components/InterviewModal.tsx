import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, Save, CheckCircle2 } from "lucide-react";

import { getStoredAnswers, saveStoredAnswer } from "@/lib/storage";

interface QuestionItem {
  id: string;
  question: string;
  testing: string;
  mention: string;
  avoid: string;
}

interface InterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  questionItem: QuestionItem | null;
}

export function InterviewModal({ open, onOpenChange, analysisId, questionItem }: InterviewModalProps) {
  const [answerText, setAnswerText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (questionItem && analysisId) {
      setSavedSuccess(false);
      // 1. Check local storage first (immediate, reliable)
      const localAnswers = getStoredAnswers(analysisId);
      const localFound = localAnswers.find((a) => a.questionId === questionItem.id);
      if (localFound) {
        setAnswerText(localFound.answer);
      } else {
        setAnswerText("");
      }

      // 2. Async fetch from API to sync if available
      fetch(`/api/answers/${analysisId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && Array.isArray(data.answers)) {
            const found = data.answers.find((a: any) => a.questionId === questionItem.id);
            if (found && found.answer) {
              setAnswerText(found.answer);
              saveStoredAnswer(analysisId, questionItem.id, found.answer);
            }
          }
        })
        .catch(() => {});
    }
  }, [questionItem, analysisId, open]);

  if (!questionItem) return null;

  const handleSave = async () => {
    if (!answerText.trim()) {
      toast.error("Please write your answer before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const cleanAnswer = answerText.trim();
      // 1. Persist directly in localStorage
      saveStoredAnswer(analysisId, questionItem.id, cleanAnswer);

      // 2. Fire API request asynchronously
      fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          questionId: questionItem.id,
          answer: cleanAnswer,
        }),
      }).catch(() => {});

      setSavedSuccess(true);
      toast.success("Interview answer saved successfully!");
      setTimeout(() => onOpenChange(false), 800);
    } catch (err: any) {
      toast.error(err.message || "Failed to save answer.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#f6f1e7] text-[#16263b] rounded-[1.5rem] border border-[#ded5c5] p-6 shadow-2xl">
        <DialogHeader>
          <div className="eyebrow text-[#e7684a] flex items-center gap-1">
            <Sparkles size={14} /> INTERVIEW ANSWER WORKSPACE
          </div>
          <DialogTitle className="font-display text-2xl tracking-[-.04em] text-[#16263b] mt-1">
            {questionItem.question}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#657180] mt-1">
            Draft your answer using STAR (Situation, Task, Action, Result) methodology.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[#ded5c5] bg-[#fffdf8] p-4 text-xs space-y-2">
            <div>
              <strong className="text-[#16263b] font-semibold">What recruiters test:</strong>{" "}
              <span className="text-[#657180]">{questionItem.testing}</span>
            </div>
            <div>
              <strong className="text-[#35634c] font-semibold">Key points to mention:</strong>{" "}
              <span className="text-[#657180]">{questionItem.mention}</span>
            </div>
            <div>
              <strong className="text-[#a4432e] font-semibold">Pitfalls to avoid:</strong>{" "}
              <span className="text-[#657180]">{questionItem.avoid}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657180] mb-2 block">
              Your Prepared Answer
            </label>
            <textarea
              rows={6}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Structure your answer: Describe the Situation/Task, your specific Action with technologies/tools used, and the quantifiable Result..."
              className="w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] p-3 text-sm outline-none transition focus:border-[#e7684a]"
            />
          </div>

          <DialogFooter className="flex items-center justify-between border-t border-[#ded5c5] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full border-[#ded5c5] bg-transparent text-sm font-bold text-[#657180]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-[#16263b] px-6 text-sm font-bold text-[#fffaf2] hover:bg-[#263b55] flex items-center gap-2"
            >
              {savedSuccess ? <CheckCircle2 size={16} className="text-[#668f7b]" /> : <Save size={16} />}
              {isSaving ? "Saving..." : savedSuccess ? "Saved!" : "Save Answer"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
