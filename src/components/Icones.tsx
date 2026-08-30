/** Petites icônes en trait, 24x24, héritant de la couleur du texte. */
type P = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconeJour = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4M8 13.5h8M8 17h5" />
  </svg>
)

export const IconeMois = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 19.5V5M4 19.5h16" />
    <path d="M8 19.5v-6M12.5 19.5V9M17 19.5v-8.5" />
  </svg>
)

export const IconeContrats = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.5 2.5h7.5l4.5 4.5v14h-12z" />
    <path d="M14 2.5V7h4.5M9 12h6M9 16h4" />
  </svg>
)

export const IconeTarifs = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2.5v19M16.5 6.5H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7" />
  </svg>
)

export const IconeReglages = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.4v-.3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
  </svg>
)

export const IconePlus = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)

export const IconeCorbeille = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5l1 13.5h9l1-13.5M10.5 10v6.5M13.5 10v6.5" />
  </svg>
)

export const IconeGauche = (p: P) => (
  <svg {...base} {...p}><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>
)

export const IconeDroite = (p: P) => (
  <svg {...base} {...p}><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>
)

export const IconeCopie = (p: P) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
    <path d="M15 6.5V5.5a2 2 0 0 0-2-2H5.5a2 2 0 0 0-2 2V13a2 2 0 0 0 2 2h1" />
  </svg>
)

export const IconeAlerte = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 2.8 19.5h18.4z" /><path d="M12 9.5v4.5M12 17h.01" />
  </svg>
)

export const IconeInfo = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8h.01" />
  </svg>
)

export const IconeImprimer = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 9V3.5h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14.5" width="10" height="6" rx="1" />
  </svg>
)

export const IconeExport = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 15.5V3.5M8 7l4-3.5L16 7" />
    <path d="M4 14.5v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </svg>
)

export const IconeEtoile = ({ pleine, ...p }: P & { pleine?: boolean }) => (
  <svg {...base} {...p} fill={pleine ? 'currentColor' : 'none'}>
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
  </svg>
)

export const IconeChevron = (p: P) => (
  <svg {...base} {...p}><path d="M6 9.5 12 15.5l6-6" /></svg>
)

export const IconeValide = (p: P) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)

export const IconePoignee = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={2.4} />
  </svg>
)
