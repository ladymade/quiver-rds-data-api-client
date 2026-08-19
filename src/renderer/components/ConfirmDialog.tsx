import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        data-testid="confirm-dialog"
        showCloseButton={false}
        className="w-[calc(100vw-2rem)] sm:w-[min(90vw,46rem)] lg:w-[min(84vw,50rem)] max-w-none sm:max-w-none overflow-hidden rounded-xl border border-[#ba1a1a]/40 bg-white p-0 shadow-xl"
      >
        <DialogHeader className="h-14 flex-row items-center gap-3 border-b border-[#f2b8b5] bg-[#ffdad6] px-6 py-4">
          <AlertCircle className="text-red-700" size={22} strokeWidth={2.2} />
          <DialogTitle className="text-[16px] leading-6 font-semibold text-red-700">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <p className="text-[14px] leading-5 text-slate-800">{message}</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f2b8b5] bg-[#fff8f7] px-6 py-4">
          <Button
            data-testid="dialog-cancel-button"
            onClick={onCancel}
            type="button"
            variant="outline"
            className="h-8 rounded border border-[#bac9cc] bg-white px-4 py-2 text-[12px] font-medium"
            disabled={isConfirming}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            data-testid="dialog-confirm-button"
            onClick={onConfirm}
            type="button"
            className="h-8 rounded bg-[#ba1a1a] px-4 py-2 text-[12px] font-medium tracking-[0.05em] text-white hover:bg-[#a31313]"
            disabled={isConfirming}
          >
            {isConfirming ? t("common.deleting") : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
