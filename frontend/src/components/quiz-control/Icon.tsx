type IconName =
  | "account"
  | "add"
  | "analytics"
  | "bolt"
  | "book"
  | "check"
  | "dashboard"
  | "group"
  | "play"
  | "quiz"
  | "rocket"
  | "settings"
  | "shuffle"
  | "star"
  | "timer"
  | "trending";

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

const paths: Record<IconName, React.ReactNode> = {
  account: <><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c.7-3.3 3-5 6.5-5s5.8 1.7 6.5 5"/><circle cx="12" cy="12" r="9.5"/></>,
  add: <path d="M12 5v14M5 12h14" />,
  analytics: <><path d="M5 19V9M12 19V5M19 19v-7"/><path d="M3 19h18"/></>,
  bolt: <path d="m13.5 2-8 12h6l-1 8 8-12h-6z" />,
  book: <><path d="M4 4.5A3.5 3.5 0 0 1 7.5 8H20v12H7.5A3.5 3.5 0 0 0 4 16.5z"/><path d="M4 4.5V17"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  group: <><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c.5-3.5 2.5-5 6-5s5.5 1.5 6 5M15 15c3.5-.3 5.4 1 6 4"/></>,
  play: <path d="m8 5 11 7-11 7z" />,
  quiz: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.3-.7.8-.7 1.6M12 16.5v.1"/></>,
  rocket: <><path d="M14.5 5.5c2.5-2.5 5.5-2.5 5.5-2.5s0 3-2.5 5.5l-5 5-4-4z"/><path d="M8.5 9.5 5 10l-2 3 5 1M12.5 13.5 12 17l-3 2-1-5M6 18c-1 1-3 1-3 1s0-2 1-3"/><circle cx="15.5" cy="7.5" r="1.4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.3 3.1h4.8l.3-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/></>,
  shuffle: <><path d="M4 7h3c4 0 5 10 10 10h3"/><path d="m17 14 3 3-3 3M4 17h3c1.7 0 2.8-1.7 4-4M14 7c1-1.5 2-2 3-2h3M17 2l3 3-3 3"/></>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/></>,
  trending: <><path d="m3 17 6-6 4 4 7-8"/><path d="M15 7h5v5"/></>,
};

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}
