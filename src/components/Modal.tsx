import type { PropsWithChildren } from "react";

interface ModalProps extends PropsWithChildren {
  onClose?: () => void;
  labelledBy?: string;
  className?: string;
}

export function Modal({ children, onClose: _onClose, labelledBy, className = "" }: ModalProps) {
  return (
    <div className="overlay" role="presentation">
      <section
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>
  );
}
