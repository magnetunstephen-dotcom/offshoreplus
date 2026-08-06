import type { PropsWithChildren } from "react";

interface ModalProps extends PropsWithChildren {
  onClose?: () => void;
  labelledBy?: string;
  className?: string;
}

export function Modal({ children, onClose, labelledBy, className = "" }: ModalProps) {
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
