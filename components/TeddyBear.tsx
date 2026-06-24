"use client";

import { useId, useEffect, useState } from "react";

export type TeddyState = "idle" | "listening" | "thinking" | "speaking";

type TeddyBearProps = {
  state?: TeddyState;
  className?: string;
};

function TeddyBearIdle({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
  
      setTimeout(() => {
        setBlink(false);
      }, 150);
    }, 5000 + Math.random() * 3000);
  
    return () => clearInterval(interval);
  }, []);
  return (
    <svg
      viewBox="0 0 400 460"
      className={className}
      role="img"
      aria-label="Teddy, a friendly brown teddy bear"
    >
      <defs>
        <radialGradient id={`${id}-fur`} cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#f4d5a8" />
          <stop offset="45%" stopColor="#c8894a" />
          <stop offset="100%" stopColor="#8f5a2b" />
        </radialGradient>
        <radialGradient id={`${id}-furShadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a66b38" stopOpacity="0" />
          <stop offset="100%" stopColor="#6b3f1f" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id={`${id}-earInner`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffd8b0" />
          <stop offset="100%" stopColor="#d99557" />
        </radialGradient>
        <radialGradient id={`${id}-snout`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff4e6" />
          <stop offset="100%" stopColor="#e8bc86" />
        </radialGradient>
        <radialGradient id={`${id}-belly`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f0c78a" />
          <stop offset="100%" stopColor="#b8743f" />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#6b4423" />
          <stop offset="100%" stopColor="#3d2312" />
        </radialGradient>
        <filter id={`${id}-softShadow`} x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#6b3f1f" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter={`url(#${id}-softShadow)`}>
        {/* Body */}
        <ellipse cx="200" cy="355" rx="118" ry="88" fill={`url(#${id}-belly)`} />
        <ellipse cx="200" cy="365" rx="98" ry="62" fill={`url(#${id}-furShadow)`} />

        {/* Arms */}
        <ellipse cx="92" cy="330" rx="34" ry="48" fill={`url(#${id}-fur)`} />
        <ellipse cx="308" cy="330" rx="34" ry="48" fill={`url(#${id}-fur)`} />
        <ellipse cx="92" cy="352" rx="22" ry="18" fill="#f2b98a" opacity="0.45" />
        <ellipse cx="308" cy="352" rx="22" ry="18" fill="#f2b98a" opacity="0.45" />

        {/* Ears */}
        <circle cx="118" cy="118" r="52" fill={`url(#${id}-fur)`} />
        <circle cx="282" cy="118" r="52" fill={`url(#${id}-fur)`} />
        <circle cx="118" cy="122" r="28" fill={`url(#${id}-earInner)`} />
        <circle cx="282" cy="122" r="28" fill={`url(#${id}-earInner)`} />

        {/* Head */}
        <ellipse cx="200" cy="210" rx="132" ry="138" fill={`url(#${id}-fur)`} />

        {/* Snout */}
        <ellipse cx="200" cy="248" rx="78" ry="62" fill={`url(#${id}-snout)`} />

        {/* Cheeks */}
        <ellipse cx="118" cy="248" rx="24" ry="16" fill="#f7a8a8" opacity="0.35" />
        <ellipse cx="282" cy="248" rx="24" ry="16" fill="#f7a8a8" opacity="0.35" />

    {/* Eyes */}
{!blink ? (
  <>
    <ellipse cx="152" cy="205" rx="34" ry="38" fill="#ffffff" />
    <ellipse cx="248" cy="205" rx="34" ry="38" fill="#ffffff" />

    <ellipse cx="154" cy="210" rx="22" ry="26" fill={`url(#${id}-iris)`} />
    <ellipse cx="250" cy="210" rx="22" ry="26" fill={`url(#${id}-iris)`} />

    <circle cx="162" cy="200" r="10" fill="#1f1208" />
    <circle cx="258" cy="200" r="10" fill="#1f1208" />

    <circle cx="166" cy="194" r="4.5" fill="#ffffff" opacity="0.95" />
    <circle cx="262" cy="194" r="4.5" fill="#ffffff" opacity="0.95" />
  </>
) : (
  <>
    <line
      x1="128"
      y1="205"
      x2="176"
      y2="205"
      stroke="#5c3a24"
      strokeWidth="5"
      strokeLinecap="round"
    />

    <line
      x1="224"
      y1="205"
      x2="272"
      y2="205"
      stroke="#5c3a24"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </>
)}

        {/* Nose */}
        <ellipse cx="200" cy="248" rx="16" ry="12" fill="#5c3a24" />
        <ellipse cx="196" cy="244" rx="5" ry="3" fill="#ffffff" opacity="0.35" />

        {/* Smile */}
        <path
          d="M168 278 Q200 304 232 278"
          fill="none"
          stroke="#5c3a24"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M176 276 Q200 292 224 276"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Soft tummy highlight */}
        <ellipse cx="200" cy="340" rx="52" ry="38" fill="#ffe8c8" opacity="0.22" />
      </g>
    </svg>
  );
}

export default function TeddyBear({ state = "idle", className }: TeddyBearProps) {
  switch (state) {
    case "idle":
    case "listening":
    case "thinking":
    case "speaking":
    default:
      return <TeddyBearIdle className={className} />;
  }
}
