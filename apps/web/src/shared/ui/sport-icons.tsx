export function BowlingIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path
        d="M15.7 2.4c-1.5 0-2.5 1-2.5 2.4 0 .9.4 1.5.8 2.1.3.5.6.9.6 1.5 0 .8-.7 1.8-1.4 2.8-.8 1.1-1.7 2.4-1.7 3.8 0 1.9 1.6 2.8 4.2 2.8s4.2-.9 4.2-2.8c0-1.4-.9-2.7-1.7-3.8-.7-1-1.4-2-1.4-2.8 0-.6.3-1 .6-1.5.4-.6.8-1.2.8-2.1 0-1.4-1-2.4-2.5-2.4Z"
        fill="white"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path d="M13.8 7.1h3.8" stroke="#E84D3D" strokeWidth={1.5} />
      <path d="M13.9 9.1h3.6" stroke="#E84D3D" strokeWidth={1.5} />
      <circle cx="8" cy="16" r="5.7" fill="currentColor" />
      <circle cx="6.2" cy="13.8" r="0.8" fill="white" />
      <circle cx="8.6" cy="13.1" r="0.8" fill="white" />
      <circle cx="7.6" cy="16" r="0.8" fill="white" />
    </svg>
  );
}

export function BaseballIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8.2" fill="#FFF7EA" stroke="currentColor" />
      <path d="M7.7 5.8c1.8 3.2 1.8 9.2 0 12.4" stroke="#E84D3D" />
      <path d="M16.3 5.8c-1.8 3.2-1.8 9.2 0 12.4" stroke="#E84D3D" />
      <path d="m6.9 8.5 2.1.8" stroke="#E84D3D" />
      <path d="m6.9 12 2.4.2" stroke="#E84D3D" />
      <path d="m6.9 15.5 2.1-.8" stroke="#E84D3D" />
      <path d="m17.1 8.5-2.1.8" stroke="#E84D3D" />
      <path d="m17.1 12-2.4.2" stroke="#E84D3D" />
      <path d="m17.1 15.5-2.1-.8" stroke="#E84D3D" />
    </svg>
  );
}

export function PingPongIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path
        d="M14.3 14.7 18.6 20c.6.7.5 1.7-.2 2.2-.7.5-1.7.4-2.2-.3l-4.1-5.4"
        fill="#C79A64"
        stroke="#181716"
        strokeWidth={1.35}
      />
      <path d="m15.2 16.1 2.7 3.5" stroke="#8B5E34" strokeWidth={1.2} />
      <circle
        cx="10.4"
        cy="9.4"
        r="6.8"
        fill="currentColor"
        stroke="#181716"
        strokeWidth={1.35}
      />
      <path
        d="M6.1 13.8c2.2 2.2 5.8 2.4 8.2.3"
        stroke="#181716"
        strokeOpacity={0.22}
        strokeWidth={1}
      />
      <path
        d="M6.7 6.1c1.8-1.5 4.5-1.8 6.5-.6"
        stroke="white"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      <circle
        cx="19.1"
        cy="5.2"
        r="2.4"
        fill="#FEE500"
        stroke="#181716"
        strokeWidth={0.8}
      />
    </svg>
  );
}

export function ShoeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M4 15.5V12c0-1 .8-1.8 1.8-1.8h2.3c1.7 0 2.4 1.1 3.6 2.3 1.1 1.1 2.3 1.8 4 1.8H19c1.1 0 2 .9 2 2v1.2c0 .8-.7 1.5-1.5 1.5H6.2C5 19 4 18 4 16.8v-1.3Z" />
      <path d="M4 16h17" />
      <path d="M8.2 10.2 7.5 7" />
      <path d="M10.8 11.1 10 8.5" />
    </svg>
  );
}

export function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M24 9C14.6 9 7 14.8 7 22c0 4.6 3.1 8.7 7.8 11L13 39.6c-.2.7.6 1.2 1.2.8l7.5-5.1c.8.1 1.5.2 2.3.2 9.4 0 17-5.8 17-13S33.4 9 24 9Z" />
    </svg>
  );
}
