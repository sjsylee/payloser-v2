type KakaoTalkIconProps = {
  className?: string;
};

export function KakaoTalkIcon({ className = "h-5 w-5" }: KakaoTalkIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4.2c-5.05 0-9.15 3.17-9.15 7.08 0 2.54 1.74 4.76 4.35 6l-.62 2.25c-.13.48.42.86.82.57l2.75-1.83c.6.08 1.22.12 1.85.12 5.05 0 9.15-3.17 9.15-7.11 0-3.91-4.1-7.08-9.15-7.08Z"
        fill="currentColor"
      />
    </svg>
  );
}
