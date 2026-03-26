import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
}

export default function Card({ className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-stone-200 bg-white shadow-sm p-6 ${className}`}
    >
      {children}
    </div>
  );
}
