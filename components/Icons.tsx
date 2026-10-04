// Line icons from the design, as React components.
type P = { small?: boolean; className?: string; style?: React.CSSProperties };
const cls = (p: P) => ["i", p.small ? "sm" : "", p.className ?? ""].join(" ").trim();

export const HomeIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /></svg>);
export const SearchIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>);
export const BellIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>);
export const TradeIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><path d="M4 18 9 11l4 3 7-9" /><path d="M15 5h5v5" /></svg>);
export const TradeBoxIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M7 15l3-3 2 2 5-5" /></svg>);
export const ProfileIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
export const PlusIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>);
export const NewPostIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>);
export const BackIcon = (p: P) => (<svg className={cls(p)} style={p.style} viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const ReplyIcon = (p: P) => (<svg className={cls({ ...p, small: true })} style={p.style} viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" /></svg>);
export const RepostIcon = (p: P) => (<svg className={cls({ ...p, small: true })} style={p.style} viewBox="0 0 24 24"><path d="M7 7h11v6M18 7l-3-3M17 17H6v-6M6 17l3 3" /></svg>);
export const LikeIcon = (p: P) => (<svg className={cls({ ...p, small: true })} style={p.style} viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>);
export const ShareIcon = (p: P) => (<svg className={cls({ ...p, small: true })} style={p.style} viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" /></svg>);
export const LockIcon = () => (<svg className="i sm" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const ChainIcon = () => (<svg className="i sm" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>);
export const ImageIcon = (p: P) => (<svg className={cls(p)} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></svg>);
export const MoreIcon = (p: P) => (<svg className={cls(p)} viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>);
export const WalletIcon = (p: P) => (<svg className={cls(p)} viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /></svg>);
export const LinkIcon = (p: P) => (<svg className={cls(p)} viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" /><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" /></svg>);
export const CalendarIcon = (p: P) => (<svg className={cls(p)} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>);

export const LogoMark = () => (
  <span className="mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 16l5-5 4 3 7-8" /></svg></span>
);

export const VerifiedCheck = () => (
  <svg className="vcheck" viewBox="0 0 24 24" aria-label="Verified trader">
    <path fill="var(--brand)" d="M12 1.8l2.4 1.8 3-.3 1 2.8 2.7 1.4-.4 3L22.4 12l-1.7 2.5.4 3-2.7 1.4-1 2.8-3-.3L12 22.2l-2.4-1.8-3 .3-1-2.8-2.7-1.4.4-3L1.6 12l1.7-2.5-.4-3 2.7-1.4 1-2.8 3 .3z" />
    <path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
