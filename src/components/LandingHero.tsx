"use client";

import dynamic from "next/dynamic";

const LandingScene = dynamic(() => import("@/scenes/LandingScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full" aria-hidden />
  ),
});

export function LandingHero() {
  return (
    <div className="absolute inset-0 -z-10">
      <LandingScene />
    </div>
  );
}
