import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const ChevronUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M6 15l6-6 6 6" /></svg>
);
export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>
);
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>
);
export const BackIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </svg>
);
export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </svg>
);
export const PowerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3v9" />
    <path d="M6.4 7.4a8 8 0 1 0 11.2 0" />
  </svg>
);
export const VolumeUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 8.5a5 5 0 0 1 0 7" />
    <path d="M20 6a9 9 0 0 1 0 12" />
  </svg>
);
export const VolumeDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 8.5a5 5 0 0 1 0 7" />
  </svg>
);
export const VolumeMute = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M22 9l-6 6" />
    <path d="M16 9l6 6" />
  </svg>
);
export const SignalIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.5 15a10 10 0 0 1 15 0" opacity="0.4" />
    <path d="M7.5 17.5a6 6 0 0 1 9 0" opacity="0.7" />
    <circle cx="12" cy="20" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 4v5h-5" />
  </svg>
);
export const TvIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M8 21h8" />
  </svg>
);
export const KeyboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8.5 14h7" />
  </svg>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-3.6-3.6" />
  </svg>
);
export const EnterIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M20 6v5a3 3 0 0 1-3 3H5" />
    <path d="M9 10l-4 4 4 4" />
  </svg>
);
export const BackspaceIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M21 5H9.5a2 2 0 0 0-1.5.7L3 12l5 6.3a2 2 0 0 0 1.5.7H21a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
    <path d="M17 9.5l-5 5M12 9.5l5 5" />
  </svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const SendIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
