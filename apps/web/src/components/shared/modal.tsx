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
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          style={{ background: "var(--scrim)" }}
        />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-40px)] bg-white rounded-[20px] p-7 max-h-[88vh] overflow-y-auto outline-none transition-all duration-200 ease-out data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95"
          style={{ maxWidth }}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
