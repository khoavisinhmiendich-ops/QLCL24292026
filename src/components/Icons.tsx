const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>,
  folder: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  book: <><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" /><path d="M19 19v2H6" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.500-2-3.400-2.300.9a7 7 0 00-2-1.200L14 3h-4l-.6 2.600a7 7 0 00-2 1.200l-2.300-.9-2 3.400 2 1.500A7 7 0 005 12c0 .4 0 .8.1 1.200l-2 1.500 2 3.400 2.300-.9a7 7 0 002 1.200L10 21h4l.6-2.600a7 7 0 002-1.200l2.300.9 2-3.400-2-1.500c.1-.4.100-.8.100-1.200z" /></>,
  logout: <><path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4" /><path d="M16 8l4 4-4 4M20 12H9" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
  file: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
  database: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.700 3.600 3 8 3s8-1.300 8-3V6M4 12v6c0 1.700 3.600 3 8 3s8-1.300 8-3v-6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  bot: <><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 4v4M9 13v1M15 13v1" /><circle cx="12" cy="3.500" r="1" /></>,
  users: <><circle cx="9" cy="8" r="3.500" /><path d="M2.500 20c0-3.500 3-6 6.500-6s6.500 2.500 6.500 6" /><path d="M16 4.500a3.500 3.500 0 010 7M18 14c2.200.7 3.500 2.700 3.500 6" /></>,
  send: <path d="M4 12l16-8-6 16-3-7-7-1z" />,
  doc: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M9 13h6M9 17h4" /></>,
};
export function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof P | string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{P[name]}</svg>;
}
