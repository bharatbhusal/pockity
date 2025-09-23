import { ModalProps } from "@/types/modal";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on "Esc" key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm">
      {/* Overlay to close modal on outside click */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative max-w-lg rounded-xl border-[.5px] border-solid border-gray-400 bg-black/20 p-2 shadow-xl backdrop-blur-lg`}
      >
        {/* Close button */}
        <button
          className="absolute right-2 top-1 text-3xl text-white"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Header with title */}
        <div className="border-b p-5 font-quantum text-xl text-white">{title}</div>

        {/* Modal Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
