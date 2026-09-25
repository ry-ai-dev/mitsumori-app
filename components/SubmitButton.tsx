"use client";

type Props = {
  isSubmitting: boolean;
  children: React.ReactNode;
  submittingLabel?: string;
  className?: string;
  type?: "submit" | "button";
  onClick?: () => void;
};

/**
 * 送信中はボタンを disabled にして二重送信を防ぐ共通ボタン。
 * 課題1で発生した「ボタン連打による二重送信」を防ぐため、最初から全フォームで採用する。
 */
export default function SubmitButton({
  isSubmitting,
  children,
  submittingLabel = "送信中...",
  className = "btn-primary",
  type = "submit",
  onClick,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className={className}
    >
      {isSubmitting ? submittingLabel : children}
    </button>
  );
}
