import React from 'react';

/**
 * SmritiCompanionAvatar
 * Renders Smriti's friendly botanical robot companion with headphones,
 * gentle expressive eyes, warm smile, and cute leaf sprout antenna,
 * matching media_1789674881835.png.
 */
export default function SmritiCompanionAvatar({
  className = 'w-16 h-16',
  isAnimated = false,
  isListening = false,
  isSpeaking = false
}) {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Dynamic Voice Pulse Ring */}
      {(isListening || isSpeaking) && (
        <span
          className={`absolute -inset-2 rounded-full border-2 animate-ping pointer-events-none ${
            isListening
              ? 'border-emerald-400/60 dark:border-emerald-400/40'
              : 'border-teal-400/60 dark:border-teal-400/40'
          }`}
        />
      )}

      {/* SVG Companion Graphic */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full transform transition-transform duration-300 ${
          isAnimated ? 'hover:scale-105' : ''
        }`}
      >
        <defs>
          <linearGradient id="smritiBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2F5EC" />
            <stop offset="100%" stopColor="#CEEBDD" />
          </linearGradient>
          <linearGradient id="smritiBgDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B2621" />
            <stop offset="100%" stopColor="#061814" />
          </linearGradient>
          <linearGradient id="smritiFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#143D30" />
            <stop offset="100%" stopColor="#0E2D23" />
          </linearGradient>
          <linearGradient id="smritiLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>

        {/* Circular Outer Container */}
        <circle
          cx="50"
          cy="50"
          r="47"
          className="fill-[url(#smritiBgGrad)] dark:fill-[url(#smritiBgDarkGrad)] stroke-[#BDE3CF] dark:stroke-[#18453B]"
          strokeWidth="2.5"
        />

        {/* Sprout Stem */}
        <path
          d="M50 26 C50 20, 50 16, 50 14"
          stroke="#16A34A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Sprout Leaf Left */}
        <path
          d="M50 17 C42 16, 38 10, 43 7 C48 7, 49 13, 50 17 Z"
          fill="url(#smritiLeafGrad)"
        />

        {/* Sprout Leaf Right */}
        <path
          d="M50 15 C58 13, 62 8, 57 5 C52 5, 51 11, 50 15 Z"
          fill="#22C55E"
        />

        {/* Headphones Headband */}
        <path
          d="M26 49 C26 34, 74 34, 74 49"
          fill="none"
          stroke="#1B4D3E"
          strokeWidth="4"
          strokeLinecap="round"
          className="dark:stroke-[#2DD4BF]"
        />

        {/* Left Ear Cushion */}
        <rect
          x="20"
          y="44"
          width="7"
          height="18"
          rx="3.5"
          fill="#143D30"
          className="dark:fill-[#2DD4BF]"
        />
        <rect
          x="22"
          y="47"
          width="3"
          height="12"
          rx="1.5"
          fill="#86EFAC"
          className="dark:fill-[#070D0E]"
        />

        {/* Right Ear Cushion */}
        <rect
          x="73"
          y="44"
          width="7"
          height="18"
          rx="3.5"
          fill="#143D30"
          className="dark:fill-[#2DD4BF]"
        />
        <rect
          x="75"
          y="47"
          width="3"
          height="12"
          rx="1.5"
          fill="#86EFAC"
          className="dark:fill-[#070D0E]"
        />

        {/* Robot Head Body */}
        <rect
          x="28"
          y="34"
          width="44"
          height="38"
          rx="14"
          fill="white"
          stroke="#1B4D3E"
          strokeWidth="3.5"
          className="dark:fill-[#0E1A17] dark:stroke-[#2DD4BF]"
        />

        {/* Screen / Visor Area */}
        <rect
          x="33"
          y="40"
          width="34"
          height="25"
          rx="9"
          fill="url(#smritiFaceGrad)"
          className="dark:fill-[#06120F]"
        />

        {/* Left Eye */}
        <ellipse
          cx="43"
          cy="50"
          rx="3.5"
          ry="4.5"
          fill="#86EFAC"
          className="dark:fill-[#4ADE80]"
        />
        <circle cx="44.2" cy="48.5" r="1.2" fill="white" />

        {/* Right Eye */}
        <ellipse
          cx="57"
          cy="50"
          rx="3.5"
          ry="4.5"
          fill="#86EFAC"
          className="dark:fill-[#4ADE80]"
        />
        <circle cx="58.2" cy="48.5" r="1.2" fill="white" />

        {/* Gentle Happy Smile */}
        <path
          d="M45 58 Q50 62 55 58"
          fill="none"
          stroke="#86EFAC"
          strokeWidth="2"
          strokeLinecap="round"
          className="dark:stroke-[#4ADE80]"
        />

        {/* Cheerful Blush Dots */}
        <circle cx="38" cy="56" r="1.5" fill="#FCA5A5" opacity="0.8" />
        <circle cx="62" cy="56" r="1.5" fill="#FCA5A5" opacity="0.8" />
      </svg>
    </div>
  );
}
