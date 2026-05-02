import type { Metadata } from "next";
import {
  Architects_Daughter,
  Caveat,
  IBM_Plex_Mono,
} from "next/font/google";
import "./wireframes.css";
import WireframesView from "./WireframesView";

const architectsDaughter = Architects_Daughter({
  subsets: ["latin"],
  weight: "400",
  variable: "--wf-font-hand",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--wf-font-display",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--wf-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wireframes",
  description:
    "Low-fi wireframe storyboard for KnowHow — 7 screens × 2 directions (safe + bold).",
};

export default function WireframesPage() {
  return (
    <div
      className={`${architectsDaughter.variable} ${caveat.variable} ${plexMono.variable}`}
    >
      <WireframesView />
    </div>
  );
}
