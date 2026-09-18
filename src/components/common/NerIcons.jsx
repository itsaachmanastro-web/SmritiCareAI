import React from 'react';

// SmritiCare Brand Logo (Dual-brain split motif: Orange neural half + Teal digital half)
export function SmritiLogo({ className = "w-10 h-10", showText = true, textClass = "text-xl font-bold" }) {
  const svg = (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" className="fill-slate-100 stroke-slate-200 dark:fill-[#1E293B] dark:stroke-[#334155] print:fill-slate-100 print:stroke-slate-200" strokeWidth="2" />
      {/* Left half: Warm Orange Neural Circuit */}
      <path d="M50 16 C34 16 22 28 22 44 C22 55 28 65 37 72 C41 75 45 80 47 84 H50 V16 Z" fill="#EA580C" />
      {/* Circuit traces on left */}
      <circle cx="34" cy="34" r="3.5" fill="#FFFFFF" />
      <circle cx="30" cy="54" r="3.5" fill="#FFFFFF" />
      <path d="M34 34 L44 42 L44 58 L30 54" stroke="#FED7AA" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right half: Teal Digital / Empathetic leaf */}
      <path d="M50 16 C66 16 78 28 78 44 C78 55 72 65 63 72 C59 75 55 80 53 84 H50 V16 Z" fill="#0D9488" />
      {/* Digital nodes on right */}
      <circle cx="66" cy="34" r="3.5" fill="#FFFFFF" />
      <circle cx="70" cy="54" r="3.5" fill="#FFFFFF" />
      <path d="M66 34 L56 42 L56 58 L70 54" stroke="#99F6E4" strokeWidth="2.5" strokeLinecap="round" />
      {/* Center glowing spark */}
      <circle cx="50" cy="48" r="4" fill="#FEF08A" />
    </svg>
  );

  if (!showText) {
    return svg;
  }

  return (
    <div className="flex items-center gap-3 select-none">
      {svg}
      <div className="flex flex-col text-left">
        <span className={`font-display tracking-tight text-slate-900 dark:text-white print:text-slate-900 ${textClass}`}>
          Smriti<span className="text-smriti-teal-600 dark:text-teal-400 print:text-teal-700">Care</span>
        </span>
        <span className="text-[11px] font-extrabold text-smriti-orange-600 dark:text-amber-400 print:text-orange-700 tracking-wider uppercase -mt-1">
          AI for Brighter Minds
        </span>
      </div>
    </div>
  );
}

// 1. Assamese Gamosa (Red & White traditional towel)
export function GamosaIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="48" height="40" rx="4" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2.5" />
      {/* Red woven border stripes */}
      <rect x="8" y="16" width="48" height="3" fill="#DC2626" />
      <rect x="8" y="45" width="48" height="3" fill="#DC2626" />
      {/* Assamese red floral motifs (Kesu) */}
      <path d="M20 28 L24 24 L28 28 L24 32 Z" fill="#DC2626" />
      <path d="M32 28 L36 24 L40 28 L36 32 Z" fill="#DC2626" />
      <path d="M44 28 L48 24 L52 28 L48 32 Z" fill="#DC2626" />
      <path d="M26 36 L30 32 L34 36 L30 40 Z" fill="#DC2626" />
      <path d="M38 36 L42 32 L46 36 L42 40 Z" fill="#DC2626" />
      {/* Fringes */}
      <path d="M12 52 L12 58 M20 52 L20 58 M28 52 L28 58 M36 52 L36 58 M44 52 L44 58 M52 52 L52 58" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 2. Jaapi (Traditional Conical Bamboo & Palm Hat)
export function JaapiIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wide woven brim */}
      <ellipse cx="32" cy="44" rx="26" ry="10" fill="#FEF3C7" stroke="#92400E" strokeWidth="2" />
      {/* Conical crown */}
      <path d="M8 43 L32 10 L56 43 Z" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
      {/* Top red crown knob */}
      <circle cx="32" cy="10" r="3.5" fill="#DC2626" />
      {/* Velvet star ornamentation */}
      <path d="M32 20 L35 28 L43 28 L37 33 L39 41 L32 36 L25 41 L27 33 L21 28 L29 28 Z" fill="#DC2626" />
      <circle cx="32" cy="30" r="3" fill="#1E293B" />
      <circle cx="20" cy="43" r="2.5" fill="#DC2626" />
      <circle cx="32" cy="45" r="2.5" fill="#DC2626" />
      <circle cx="44" cy="43" r="2.5" fill="#DC2626" />
    </svg>
  );
}

// 3. Xorai (Traditional Brass Bell/Tray Offering Stand)
export function XoraiIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Finial */}
      <circle cx="32" cy="8" r="3" fill="#EAB308" />
      {/* Dome Lid */}
      <path d="M22 24 C22 14 42 14 42 24 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
      {/* Shallow Tray */}
      <ellipse cx="32" cy="26" rx="24" ry="6" fill="#FDE047" stroke="#A16207" strokeWidth="2" />
      {/* Bell-shaped Stem & Base */}
      <path d="M28 26 L29 44 L16 54 H48 L35 44 L36 26 Z" fill="#EAB308" stroke="#A16207" strokeWidth="2" />
      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#CA8A04" />
      {/* Brass ring decoration */}
      <circle cx="32" cy="38" r="3" fill="#FEF08A" />
    </svg>
  );
}

// 4. Pepa (Traditional Assamese Buffalo Horn Instrument)
export function PepaIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Curved Buffalo Horn Body */}
      <path d="M12 48 C16 48 30 46 38 34 C44 26 48 18 52 14" stroke="#1E293B" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="7" strokeLinecap="round" />
      {/* Flared Brass Bell at base */}
      <path d="M8 54 C12 50 12 44 10 42 C7 42 4 48 8 54 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
      {/* Bamboo reed & fingerholes */}
      <line x1="42" y1="24" x2="52" y2="14" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
      <circle cx="44" cy="22" r="1.5" fill="#FFFFFF" />
      <circle cx="47" cy="19" r="1.5" fill="#FFFFFF" />
      {/* Red tassel ribbon */}
      <path d="M12 48 Q10 56 16 58" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 5. One-Horned Rhino (Kaziranga Pride)
export function RhinoIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body armor plates */}
      <path d="M10 38 C10 28 20 22 36 22 C48 22 56 28 58 36 L56 46 H48 L46 42 H24 L22 46 H12 Z" fill="#64748B" stroke="#334155" className="dark:stroke-slate-400" strokeWidth="2" />
      {/* Head */}
      <path d="M48 26 L58 32 L56 40 L46 36 Z" fill="#475569" className="dark:fill-slate-500" />
      {/* Distinct Single Horn */}
      <path d="M58 26 L62 20 L55 24 Z" fill="#0F172A" className="fill-slate-900 dark:fill-slate-200" />
      {/* Fold plate markings */}
      <path d="M26 24 C24 30 24 38 28 42" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 24 C38 30 38 38 42 42" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      {/* Eye */}
      <circle cx="51" cy="30" r="1.5" fill="#F8FAFC" />
    </svg>
  );
}

// 6. Great Hornbill (State Bird / Rainforest Icon)
export function HornbillIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head & Neck */}
      <path d="M30 48 C28 36 32 26 40 24 C46 22 50 28 52 34 L46 48 Z" fill="#0F172A" className="fill-slate-900 dark:fill-slate-300" />
      {/* Giant Yellow Bill & Casque */}
      <path d="M38 20 C46 16 54 18 58 22 C52 26 44 26 38 24 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
      {/* Downward curved beak */}
      <path d="M40 24 C48 24 58 26 62 36 C52 34 44 32 40 28 Z" fill="#FDE047" stroke="#EAB308" strokeWidth="1.5" />
      <path d="M48 18 L52 24" stroke="#DC2626" strokeWidth="3" />
      {/* Eye */}
      <circle cx="38" cy="27" r="2" fill="#DC2626" />
    </svg>
  );
}

// 7. Bamboo Dance Sticks (Cheraw / Bihu rhythm)
export function BambooIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="10" width="10" height="44" rx="4" fill="#84CC16" stroke="#4D7C0F" strokeWidth="2" />
      <line x1="12" y1="22" x2="22" y2="22" stroke="#3F6212" strokeWidth="2" />
      <line x1="12" y1="36" x2="22" y2="36" stroke="#3F6212" strokeWidth="2" />
      <line x1="12" y1="48" x2="22" y2="48" stroke="#3F6212" strokeWidth="2" />
      {/* Crossed Bamboo */}
      <rect x="34" y="10" width="10" height="44" rx="4" fill="#65A30D" stroke="#3F6212" strokeWidth="2" />
      <line x1="34" y1="20" x2="44" y2="20" stroke="#1A2E05" strokeWidth="2" />
      <line x1="34" y1="34" x2="44" y2="34" stroke="#1A2E05" strokeWidth="2" />
      <line x1="34" y1="46" x2="44" y2="46" stroke="#1A2E05" strokeWidth="2" />
    </svg>
  );
}

// 8. Assam Tea Leaf (Two leaves and a bud)
export function TeaLeafIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central Stem */}
      <path d="M32 54 C32 44 32 30 32 14" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
      {/* Left Leaf */}
      <path d="M32 36 C22 34 14 26 12 16 C22 18 30 26 32 32" fill="#22C55E" stroke="#16A34A" strokeWidth="1.5" />
      {/* Right Leaf */}
      <path d="M32 30 C42 28 50 20 52 10 C42 12 34 20 32 26" fill="#4ADE80" stroke="#16A34A" strokeWidth="1.5" />
      {/* Center Bud */}
      <path d="M32 18 C30 14 31 10 32 6 C33 10 34 14 32 18 Z" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.5" />
    </svg>
  );
}

// 9. Dhol Drum
export function DholIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Barrel Body */}
      <path d="M16 20 C24 16 40 16 48 20 L52 44 C44 48 20 48 12 44 Z" fill="#B45309" stroke="#78350F" strokeWidth="2" />
      {/* Leather ends */}
      <ellipse cx="14" cy="32" rx="4" ry="12" fill="#FEF3C7" stroke="#78350F" strokeWidth="2" />
      <ellipse cx="50" cy="32" rx="4" ry="12" fill="#FEF3C7" stroke="#78350F" strokeWidth="2" />
      {/* Zig-zag leather ropes */}
      <path d="M16 20 L24 46 L32 18 L40 46 L48 20" stroke="#DC2626" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// Map for quick lookup
export const NER_ICONS_MAP = {
  gamosa: { id: 'gamosa', name: 'Gamosa', assameseName: 'গামোচা', component: GamosaIcon, color: '#DC2626' },
  jaapi: { id: 'jaapi', name: 'Jaapi', assameseName: 'জাপি', component: JaapiIcon, color: '#B45309' },
  xorai: { id: 'xorai', name: 'Xorai', assameseName: 'শৰাই', component: XoraiIcon, color: '#CA8A04' },
  pepa: { id: 'pepa', name: 'Pepa Horn', assameseName: 'পেঁপা', component: PepaIcon, color: '#0F172A' },
  rhino: { id: 'rhino', name: 'One-Horned Rhino', assameseName: 'এশিঙীয়া গঁড়', component: RhinoIcon, color: '#475569' },
  hornbill: { id: 'hornbill', name: 'Great Hornbill', assameseName: 'ধনেশ পক্ষী', component: HornbillIcon, color: '#EAB308' },
  bamboo: { id: 'bamboo', name: 'Bamboo Dance', assameseName: 'বাঁহ নৃত্য', component: BambooIcon, color: '#65A30D' },
  tealeaf: { id: 'tealeaf', name: 'Assam Tea Leaf', assameseName: 'চাহৰ দুটি পাত', component: TeaLeafIcon, color: '#16A34A' },
};
