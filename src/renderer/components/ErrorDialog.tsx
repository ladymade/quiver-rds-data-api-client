import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import type React from "react";

type ErrorDialogProps = {
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
};

export function ErrorDialog({
  title,
  message,
  details: _details,
  onClose,
}: ErrorDialogProps): React.JSX.Element {
  const normalizedMessage = message.trim();

  // Prefer patterns from AWS/RDS errors: "Error: X Message: ..."
  const awsStyleMatch = /^Error:\s*([^\s:]+)\s*Message:\s*(.+)$/is.exec(normalizedMessage);
  const basicMatch = /^([^:\n]+):\s*(.+)$/s.exec(normalizedMessage);

  const errorName = awsStyleMatch?.[1] ?? basicMatch?.[1] ?? null;
  const errorBody = awsStyleMatch?.[2] ?? basicMatch?.[2] ?? normalizedMessage;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="error-dialog"
        showCloseButton={false}
        className="w-[calc(100vw-2rem)] sm:w-[min(90vw,46rem)] lg:w-[min(84vw,50rem)] max-w-none sm:max-w-none overflow-hidden rounded-xl border border-[#ba1a1a]/40 bg-white p-0 shadow-xl"
      >
        <DialogHeader className="h-14 flex-row items-center gap-3 border-b border-[#f2b8b5] bg-[#ffdad6] px-6 py-4">
          <AlertCircle className="text-red-700" size={22} strokeWidth={2.2} />
          <DialogTitle
            id="error-dialog-title"
            className="text-[16px] leading-6 font-semibold text-red-700"
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <p className="text-[14px] leading-5 text-slate-800">
            {errorName != null ? <strong className="font-semibold">{errorName}:</strong> : null}
            {errorName != null ? " " : ""}
            {errorBody}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f2b8b5] bg-[#fff8f7] px-6 py-4">
          <Button
            data-testid="dialog-close-button"
            onClick={onClose}
            type="button"
            className="h-8 rounded bg-[#ba1a1a] px-4 py-2 text-[12px] font-medium tracking-[0.05em] text-white hover:bg-[#a31313]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
