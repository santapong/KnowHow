"use client";

import { ReactNode, useState } from "react";
import {
  CommunityBold,
  CommunitySafe,
  LandingBold,
  LandingSafe,
  LoginBold,
  LoginSafe,
  ReaderBold,
  ReaderSafe,
  ReadmeFrame,
  SettingsBold,
  SettingsSafe,
  ShelfBold,
  ShelfSafe,
  UploadBold,
  UploadSafe,
} from "./screens";

type Theme = "paper" | "leather" | "midnight" | "library" | "marble";

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: "paper", label: "Paper" },
  { value: "leather", label: "Leather" },
  { value: "midnight", label: "Midnight" },
  { value: "library", label: "Library" },
  { value: "marble", label: "Marble" },
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="wf-section">
      <div className="wf-section-head">
        <h2 className="wf-section-title">{title}</h2>
        <p className="wf-section-sub">{subtitle}</p>
      </div>
      <div className="wf-artboards">{children}</div>
    </section>
  );
}

function Artboard({
  label,
  theme,
  children,
}: {
  label: string;
  theme: Theme;
  children: ReactNode;
}) {
  return (
    <div className="wf-artboard">
      <div className="wf-artboard-label">{label}</div>
      <div className="wf-artboard-frame" data-theme={theme}>
        {children}
      </div>
    </div>
  );
}

export default function WireframesView() {
  const [theme, setTheme] = useState<Theme>("marble");

  return (
    <div className="wf-canvas-bg">
      <header
        style={{
          padding: "32px 48px 0",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily:
              "var(--wf-font-mono), \"IBM Plex Mono\", ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#5a544a",
          }}
        >
          KnowHow · Wireframe Storyboard
        </div>
        <div
          style={{
            fontFamily: "var(--wf-font-display), \"Caveat\", cursive",
            fontSize: 56,
            lineHeight: 1,
            margin: "8px 0 4px",
            color: "#1a1814",
          }}
        >
          Wireframes
        </div>
        <div
          style={{
            fontFamily:
              "var(--wf-font-hand), \"Architects Daughter\", cursive",
            fontSize: 15,
            color: "#5a544a",
            maxWidth: 640,
          }}
        >
          Low-fi exploration · 7 screens × 2 directions (safe + bold). Use the
          Tweaks panel (bottom-right) to recolor.
        </div>
      </header>

      <Section
        title="00 · Read me"
        subtitle="Method, screens, and how to use the storyboard."
      >
        <Artboard label="00 · Read me" theme={theme}>
          <ReadmeFrame />
        </Artboard>
      </Section>

      <Section
        title="01 · Landing"
        subtitle="Signed-out home. Hero moment: the book opening."
      >
        <Artboard
          label="A · Safe — centered hero, headline + book"
          theme={theme}
        >
          <LandingSafe />
        </Artboard>
        <Artboard
          label="B · Bold — full-bleed open book, type wraps"
          theme={theme}
        >
          <LandingBold />
        </Artboard>
      </Section>

      <Section
        title="02 · Login"
        subtitle="Magic link + Google. No password fields, ever."
      >
        <Artboard label="A · Safe — single-column form" theme={theme}>
          <LoginSafe />
        </Artboard>
        <Artboard
          label="B · Bold — split screen, books on the left"
          theme={theme}
        >
          <LoginBold />
        </Artboard>
      </Section>

      <Section
        title="03 · Shelf"
        subtitle="Signed-in home. The 3D shelf is the headline."
      >
        <Artboard
          label="A · Safe — shelf above, controls + recents below"
          theme={theme}
        >
          <ShelfSafe />
        </Artboard>
        <Artboard
          label="B · Bold — full-bleed library, hover-card details"
          theme={theme}
        >
          <ShelfBold />
        </Artboard>
      </Section>

      <Section
        title="04 · Upload"
        subtitle="A PDF becomes a book. Browser-only parsing."
      >
        <Artboard
          label="A · Safe — dropzone + form fields + preview"
          theme={theme}
        >
          <UploadSafe />
        </Artboard>
        <Artboard
          label="B · Bold — three-frame transformation, file → cover → shelved"
          theme={theme}
        >
          <UploadBold />
        </Artboard>
      </Section>

      <Section
        title="05 · Reader"
        subtitle="The hero moment — the physicality of a book."
      >
        <Artboard label="A · Safe — 2D spread + persistent HUD" theme={theme}>
          <ReaderSafe />
        </Artboard>
        <Artboard
          label="B · Bold — perspective book, chrome dissolves"
          theme={theme}
        >
          <ReaderBold />
        </Artboard>
      </Section>

      <Section
        title="06 · Community"
        subtitle="Other readers' public shelves."
      >
        <Artboard label="A · Safe — grid of shelf-preview cards" theme={theme}>
          <CommunitySafe />
        </Artboard>
        <Artboard
          label="B · Bold — one shared library, endless shelf"
          theme={theme}
        >
          <CommunityBold />
        </Artboard>
      </Section>

      <Section
        title="07 · Settings"
        subtitle="Account, storage, privacy, danger zone."
      >
        <Artboard label="A · Safe — left rail + form" theme={theme}>
          <SettingsSafe />
        </Artboard>
        <Artboard
          label="B · Bold — colophon / book back-matter"
          theme={theme}
        >
          <SettingsBold />
        </Artboard>
      </Section>

      <div style={{ height: 64 }} />

      <aside className="wf-tweaks" aria-label="Tweaks">
        <div className="wf-tweaks-head">Tweaks</div>
        <div className="wf-tweaks-body">
          <div className="wf-tweaks-section-title">Palette</div>
          <div className="wf-tweaks-radio-label">Theme</div>
          <div className="wf-tweaks-options">
            {THEMES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="wf-tweaks-option"
                aria-pressed={theme === opt.value}
                onClick={() => setTheme(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
