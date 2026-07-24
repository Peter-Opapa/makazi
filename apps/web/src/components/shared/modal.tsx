"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

export function Modal({
  open,
  onOpenChange,
  children,
  maxWidth = 460,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50" style={{ background: "var(--scrim)" }} />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-40px)] bg-white rounded-[20px] p-7 max-h-[88vh] overflow-y-auto outline-none"
          style={{ maxWidth }}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
