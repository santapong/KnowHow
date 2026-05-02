"use client";

import {
  AppBar,
  Box,
  Btn,
  Cover,
  Display,
  Frame,
  Hand,
  Mono,
  Note,
  Pill,
  Scribble,
  Spine,
  Squiggle,
  W,
} from "./components";

// ════════════════════════════════════════════════════════════════
// 01 — LANDING (Safe)
// ════════════════════════════════════════════════════════════════
export function LandingSafe() {
  return (
    <Frame>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "24px 36px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Box w={22} h={28} filled rounded={2} />
          <Display size={22}>KnowHow</Display>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Hand size={13} color={W.ink2}>
            community
          </Hand>
          <Hand size={13} color={W.ink2}>
            about
          </Hand>
          <Btn>sign in</Btn>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          marginTop: 60,
        }}
      >
        <div style={{ width: 460 }}>
          <Mono>a 3d bookshelf for pdfs</Mono>
          <div style={{ height: 12 }} />
          <Display size={64} style={{ display: "block", lineHeight: 1.0 }}>
            Your novels,
            <br />
            on a real shelf.
          </Display>
          <div style={{ height: 18 }} />
          <Hand
            size={16}
            color={W.ink2}
            style={{ display: "block", lineHeight: 1.5 }}
          >
            Upload a PDF. Watch it become a book. Pull it off the shelf. Flip
            the pages. Keep your place.
          </Hand>
          <div style={{ height: 28 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <Btn primary>get started →</Btn>
            <Btn>see community</Btn>
          </div>
        </div>
        <div style={{ position: "relative", width: 280, height: 360 }}>
          <Cover
            w={200}
            h={280}
            title={
              <>
                Wuthering
                <br />
                Heights
              </>
            }
            author="E. Brontë"
          />
          <div style={{ position: "absolute", left: 30, top: 30 }}>
            <Cover w={200} h={280} title="" author="" />
          </div>
        </div>
      </div>

      <Note x={680} y={300} dx={120} dy={-30} side="right">
        Hero = single book that opens on scroll / load. The &ldquo;physicality&rdquo; beat.
      </Note>
      <Note x={210} y={210} dx={-40} dy={-60} side="left">
        Title in display weight. Headline tight, no marketing fluff.
      </Note>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 36,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Mono>v1 · pdf only · no AI</Mono>
        <Mono>scroll ↓ to see how it works</Mono>
      </div>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 01 — LANDING (Bold)
// ════════════════════════════════════════════════════════════════
export function LandingBold() {
  return (
    <Frame>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 60,
          transform: "translateX(-50%)",
          display: "flex",
        }}
      >
        <div
          style={{
            width: 360,
            height: 480,
            background: W.fill,
            border: `1.5px solid ${W.ink}`,
            borderRight: `0.5px dashed ${W.ink2}`,
            padding: 24,
            boxShadow: `4px 4px 0 ${W.ink3}`,
          }}
        >
          <Mono>chapter one</Mono>
          <div style={{ height: 16 }} />
          <Scribble lines={9} w="92%" gap={11} />
          <div style={{ height: 12 }} />
          <Scribble lines={5} w="80%" gap={11} />
        </div>
        <div
          style={{
            width: 360,
            height: 480,
            background: W.fill,
            border: `1.5px solid ${W.ink}`,
            borderLeft: "none",
            padding: 24,
            boxShadow: `4px 4px 0 ${W.ink3}`,
          }}
        >
          <Scribble lines={11} w="92%" gap={11} />
          <div style={{ height: 14 }} />
          <Scribble lines={4} w="60%" gap={11} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 28,
          left: 36,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Box w={22} h={28} filled rounded={2} />
        <Display size={22}>KnowHow</Display>
      </div>
      <div style={{ position: "absolute", top: 32, right: 36 }}>
        <Btn>sign in</Btn>
      </div>

      <div
        style={{ position: "absolute", left: 60, bottom: 80, width: 420 }}
      >
        <Mono>est. 2026 · pdf reader</Mono>
        <div style={{ height: 8 }} />
        <Display size={88} style={{ display: "block", lineHeight: 0.9 }}>
          Read it
          <br />
          like a book.
        </Display>
      </div>
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 80,
          width: 280,
          textAlign: "right",
        }}
      >
        <Hand
          size={15}
          color={W.ink2}
          style={{ display: "block", lineHeight: 1.5 }}
        >
          Drop a PDF. We&rsquo;ll set it on a shelf, give it a spine, and
          remember the page you stopped on.
        </Hand>
        <div style={{ height: 16 }} />
        <Btn primary>begin →</Btn>
      </div>

      <Note x={580} y={240} dx={140} dy={20} side="right">
        Open book is interactive — pages turn on cursor as you scroll.
      </Note>
      <Note x={70} y={520} dx={-30} dy={-80} side="left">
        Type wraps around the book. Asymmetric, not a hero billboard.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 02 — LOGIN (Safe)
// ════════════════════════════════════════════════════════════════
export function LoginSafe() {
  return (
    <Frame>
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 36,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Box w={22} h={28} filled rounded={2} />
        <Display size={22}>KnowHow</Display>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 380 }}>
          <Display size={38} style={{ display: "block" }}>
            Welcome back.
          </Display>
          <div style={{ height: 8 }} />
          <Hand size={14} color={W.ink2}>
            One link, no password. Or use Google.
          </Hand>
          <div style={{ height: 28 }} />

          <Mono>email</Mono>
          <div style={{ height: 6 }} />
          <Box w="100%" h={44} rounded={4}>
            <div
              style={{
                padding: "12px 14px",
                fontFamily: W.hand,
                fontSize: 14,
                color: W.ink3,
              }}
            >
              you@somewhere.com
            </div>
          </Box>
          <div style={{ height: 14 }} />
          <Btn primary w="100%">
            send magic link
          </Btn>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: W.ink3 }} />
            <Mono>or</Mono>
            <div style={{ flex: 1, height: 1, background: W.ink3 }} />
          </div>

          <Btn w="100%">
            <Box w={14} h={14} rounded={2} style={{ marginRight: 6 }} />
            continue with Google
          </Btn>
        </div>
      </div>

      <Note x={690} y={370} dx={120} dy={20} side="right">
        Two paths only. Magic link is the default; Google is escape hatch.
      </Note>

      <div style={{ position: "absolute", bottom: 24, left: 36 }}>
        <Mono>← back home</Mono>
      </div>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 02 — LOGIN (Bold)
// ════════════════════════════════════════════════════════════════
export function LoginBold() {
  return (
    <Frame>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "50%",
          background: W.bar,
          borderRight: `1.5px solid ${W.ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <Cover
            w={180}
            h={260}
            title={
              <>
                The
                <br />
                Library
              </>
            }
            author="entry pass"
          />
          <div style={{ position: "absolute", left: -30, top: 20 }}>
            <Cover w={180} h={260} title="" author="" />
          </div>
          <div style={{ position: "absolute", left: 30, top: -10 }}>
            <Cover w={180} h={260} title="" author="" />
          </div>
        </div>
        <div
          style={{ position: "absolute", bottom: 32, left: 36, right: 36 }}
        >
          <Hand size={14} italic color={W.ink2}>
            &ldquo;A bookshelf is a private museum, curated by lamplight.&rdquo;
          </Hand>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "50%",
          display: "flex",
          flexDirection: "column",
          padding: "36px 64px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Box w={22} h={28} filled rounded={2} />
          <Display size={22}>KnowHow</Display>
        </div>

        <div>
          <Mono>step 1 of 1</Mono>
          <div style={{ height: 8 }} />
          <Display size={48} style={{ display: "block", lineHeight: 1.0 }}>
            Step inside.
          </Display>
          <div style={{ height: 28 }} />

          <Mono>email</Mono>
          <div style={{ height: 6 }} />
          <div
            style={{
              borderBottom: `1.5px solid ${W.ink}`,
              paddingBottom: 8,
              fontFamily: W.hand,
              fontSize: 18,
              color: W.ink3,
            }}
          >
            you@somewhere.com
          </div>
          <div style={{ height: 28 }} />
          <Btn primary>send magic link →</Btn>

          <div style={{ height: 28 }} />
          <Hand size={13} color={W.ink2}>
            or{" "}
            <span style={{ borderBottom: `1px solid ${W.ink2}` }}>
              continue with Google
            </span>
          </Hand>
        </div>

        <Mono>← back to landing</Mono>
      </div>

      <Note x={580} y={420} dx={-30} dy={80} side="left">
        No password fields ever. Magic link only; Google is a text link, not a
        button.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 03 — SHELF (Safe)
// ════════════════════════════════════════════════════════════════
export function ShelfSafe() {
  const titles = [
    "Middlemarch",
    "Beloved",
    "Dune",
    "Persuasion",
    "1984",
    "Stoner",
    "Light Years",
    "Mrs. D.",
    "Dubliners",
  ];
  return (
    <Frame>
      <AppBar active="shelf" />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px 12px",
        }}
      >
        <div>
          <Display size={32} style={{ display: "block" }}>
            My Shelf
          </Display>
          <Mono>9 books · 4.2 GB · last opened: Beloved</Mono>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Pill>3D shelf</Pill>
          <Pill>grid</Pill>
          <Btn primary>+ upload</Btn>
        </div>
      </div>

      <div style={{ margin: "0 32px", position: "relative" }}>
        <Box
          w="100%"
          h={300}
          rounded={6}
          style={{ overflow: "hidden", background: W.bar }}
        >
          <div
            style={{
              position: "absolute",
              inset: 24,
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            {titles.map((t, i) => (
              <Spine
                key={i}
                h={200 + (i % 3) * 12}
                w={28 + (i % 2) * 4}
                title={t}
                lean={i === 5 ? -3 : 0}
              />
            ))}
            <div style={{ flex: 1 }} />
            <Hand
              size={11}
              color={W.ink3}
              style={{ position: "absolute", right: 16, bottom: 8 }}
            >
              ⟲ drag to rotate · scroll to zoom
            </Hand>
          </div>
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 16,
              height: 8,
              background: W.ink3,
              borderRadius: 2,
            }}
          />
        </Box>
      </div>

      <div style={{ padding: "24px 32px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <Display size={20}>Continue reading</Display>
          <Mono>see all →</Mono>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Cover w={92} h={130} title={titles[i]} author="—" />
              <div style={{ height: 6 }} />
              <Hand size={11} color={W.ink2}>
                p. {120 + i * 30} / 380
              </Hand>
              <div
                style={{
                  width: 92,
                  height: 3,
                  background: W.ink3,
                  borderRadius: 2,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${30 + i * 15}%`,
                    height: "100%",
                    background: W.accent,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Note x={300} y={250} dx={-40} dy={-50} side="left">
        3D shelf is the hero. WebGL canvas; click a spine to open reader.
      </Note>
      <Note x={900} y={120} dx={-40} dy={50} side="left">
        Toggle to a fast 2D grid for mobile / WebGL-off.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 03 — SHELF (Bold)
// ════════════════════════════════════════════════════════════════
export function ShelfBold() {
  const titles = [
    "Middlemarch",
    "Beloved",
    "Dune",
    "Persuasion",
    "1984",
    "Stoner",
    "Light Years",
    "Mrs. D.",
    "Dubliners",
    "Olive K.",
    "A Visit",
    "Gilead",
    "Pachinko",
  ];
  return (
    <Frame>
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 32,
          right: 32,
          display: "flex",
          justifyContent: "space-between",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Box w={20} h={26} filled rounded={2} />
          <Display size={20}>KnowHow</Display>
          <span style={{ marginLeft: 16 }}>
            <Mono>my shelf · 13 books</Mono>
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Hand size={13} color={W.ink2}>
            community
          </Hand>
          <Hand size={13} color={W.ink2}>
            upload
          </Hand>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `1.2px solid ${W.ink}`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: 80,
          background: W.bar,
        }}
      >
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            style={{ position: "relative", height: 180, marginBottom: 14 }}
          >
            <div
              style={{
                position: "absolute",
                left: 32,
                right: 32,
                bottom: 0,
                display: "flex",
                alignItems: "flex-end",
                gap: 3,
              }}
            >
              {titles.map((t, i) => (
                <Spine
                  key={i}
                  h={140 + ((i + row) % 4) * 14}
                  w={24 + ((i + row * 3) % 3) * 6}
                  title={t}
                  lean={i === 7 - row ? -4 : 0}
                />
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                left: 32,
                right: 32,
                bottom: -6,
                height: 10,
                background: W.ink,
                borderRadius: 1,
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 36,
          width: 240,
          padding: 16,
          background: W.paper,
          border: `1.5px solid ${W.ink}`,
          borderRadius: 4,
          boxShadow: `4px 4px 0 ${W.ink3}`,
        }}
      >
        <Mono>now hovering</Mono>
        <div style={{ height: 6 }} />
        <Display size={22} style={{ display: "block" }}>
          Beloved
        </Display>
        <Hand size={12} color={W.ink2} style={{ fontStyle: "italic" }}>
          Toni Morrison · 324 p.
        </Hand>
        <div style={{ height: 10 }} />
        <Hand size={11} color={W.ink2}>
          last read · p. 87 (28%)
        </Hand>
        <div style={{ height: 10 }} />
        <Btn
          primary
          w="100%"
          style={{ fontSize: 12, padding: "6px 10px" }}
        >
          open →
        </Btn>
      </div>

      <Note x={400} y={280} dx={50} dy={-60} side="right">
        Shelf fills viewport. Hover a spine, it slides out 5cm; click opens.
      </Note>
      <Note x={920} y={500} dx={-40} dy={-60} side="left">
        Hover-card replaces a sidebar — no chrome competing with the books.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 04 — UPLOAD (Safe)
// ════════════════════════════════════════════════════════════════
export function UploadSafe() {
  return (
    <Frame>
      <AppBar active="upload" />
      <div style={{ padding: "32px 80px", display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <Display size={32} style={{ display: "block" }}>
            Upload a book
          </Display>
          <Hand size={14} color={W.ink2}>
            PDF, up to 100 MB. We&rsquo;ll parse the title and make a cover.
          </Hand>
          <div style={{ height: 24 }} />

          <Box
            w="100%"
            h={220}
            dashed
            rounded={6}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 60,
                border: `1.5px solid ${W.ink}`,
                borderRadius: 3,
                position: "relative",
              }}
            >
              <Mono
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                pdf
              </Mono>
            </div>
            <Display size={18}>Drop a PDF here</Display>
            <Hand size={12} color={W.ink2}>
              or{" "}
              <span style={{ borderBottom: `1px solid ${W.ink2}` }}>
                browse files
              </span>
            </Hand>
          </Box>

          <div style={{ height: 24 }} />
          <Mono>spine color</Mono>
          <div style={{ height: 8 }} />
          <div style={{ display: "flex", gap: 10 }}>
            {["#8B4513", "#2a3a2a", "#3a2a4a", "#7a1a1a", "#1a1a2a", "#c9a45b"].map(
              (c, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 44,
                    background: c,
                    border: `1.5px solid ${W.ink}`,
                    borderRadius: 2,
                    boxShadow: i === 0 ? `0 0 0 2px ${W.accent}` : "none",
                  }}
                />
              ),
            )}
          </div>

          <div style={{ height: 24 }} />
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Box w={14} h={14} rounded={2} />
            <Hand size={13} color={W.ink2}>
              I have rights to upload this PDF (DMCA acknowledgement).
            </Hand>
          </label>

          <div style={{ height: 24 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn primary>upload book →</Btn>
            <Btn>cancel</Btn>
          </div>
        </div>

        <div style={{ width: 280 }}>
          <Mono>preview</Mono>
          <div style={{ height: 8 }} />
          <Box
            w="100%"
            h={340}
            rounded={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: W.bar,
            }}
          >
            <Cover w={140} h={210} title="(parsed title)" author="(author)" />
          </Box>
          <div style={{ height: 12 }} />
          <Mono>extracted</Mono>
          <div style={{ height: 6 }} />
          <Hand size={13} color={W.ink}>
            Beloved
          </Hand>
          <br />
          <Hand size={12} color={W.ink2}>
            Toni Morrison · 324 pages · 14.2 MB
          </Hand>
        </div>
      </div>

      <Note x={130} y={310} dx={-40} dy={-50} side="left">
        Whole flow happens in browser — pdf.js parses, we never see the bytes
        server-side.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 04 — UPLOAD (Bold)
// ════════════════════════════════════════════════════════════════
export function UploadBold() {
  return (
    <Frame>
      <AppBar active="upload" />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          bottom: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Mono>1 · drop</Mono>
          <div style={{ height: 16 }} />
          <Box
            w={180}
            h={240}
            dashed
            rounded={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mono>file.pdf</Mono>
          </Box>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Squiggle width={120} color={W.accent} height={10} />
          <Hand size={13} color={W.ink2} italic>
            parsing in browser…
          </Hand>
        </div>

        <div style={{ textAlign: "center" }}>
          <Mono>2 · becomes</Mono>
          <div style={{ height: 16 }} />
          <Cover w={180} h={240} title="Beloved" author="T. Morrison" />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Squiggle width={120} color={W.accent} height={10} />
          <Hand size={13} color={W.ink2} italic>
            placed on shelf
          </Hand>
        </div>

        <div style={{ textAlign: "center" }}>
          <Mono>3 · on shelf</Mono>
          <div style={{ height: 16 }} />
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              justifyContent: "center",
              height: 240,
            }}
          >
            <Spine h={180} w={26} title="" />
            <Spine h={200} w={26} title="" />
            <Spine h={210} w={28} title="Beloved" color={W.accent} />
            <Spine h={170} w={24} title="" />
            <Spine h={190} w={26} title="" />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          borderTop: `1.5px solid ${W.ink}`,
          background: W.bar,
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div>
          <Mono>title</Mono>
          <div
            style={{
              fontFamily: W.hand,
              fontSize: 18,
              borderBottom: `1.5px solid ${W.ink}`,
              padding: "4px 0",
              minWidth: 200,
            }}
          >
            Beloved
          </div>
        </div>
        <div>
          <Mono>author</Mono>
          <div
            style={{
              fontFamily: W.hand,
              fontSize: 18,
              borderBottom: `1.5px solid ${W.ink}`,
              padding: "4px 0",
              minWidth: 200,
            }}
          >
            Toni Morrison
          </div>
        </div>
        <div>
          <Mono>spine</Mono>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {["#8B4513", "#2a3a2a", "#3a2a4a", "#7a1a1a", "#1a1a2a", "#c9a45b"].map(
              (c, i) => (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: 30,
                    background: c,
                    border: `1.2px solid ${W.ink}`,
                    borderRadius: 1,
                    boxShadow: i === 0 ? `0 0 0 2px ${W.accent}` : "none",
                  }}
                />
              ),
            )}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Box w={12} h={12} rounded={2} />
          <Hand size={12} color={W.ink2}>
            I own the rights
          </Hand>
        </label>
        <Btn primary>shelve it →</Btn>
      </div>

      <Note x={520} y={280} dx={50} dy={-60} side="right">
        The conversion IS the UI. Three frames: file → cover → shelved.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 05 — READER (Safe)
// ════════════════════════════════════════════════════════════════
export function ReaderSafe() {
  return (
    <Frame>
      <div
        style={{
          height: 48,
          borderBottom: `1.5px solid ${W.ink}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 16,
        }}
      >
        <Hand size={13} color={W.ink2}>
          ← shelf
        </Hand>
        <div style={{ flex: 1 }} />
        <Display size={16}>Beloved</Display>
        <Hand size={12} color={W.ink2} italic>
          · Toni Morrison
        </Hand>
        <div style={{ flex: 1 }} />
        <Pill>2D</Pill>
        <Pill filled>3D</Pill>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 48,
          bottom: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: W.bar,
        }}
      >
        <Hand size={20} color={W.ink2}>
          ‹
        </Hand>
        <div
          style={{
            width: 320,
            height: 460,
            background: W.paper,
            border: `1.5px solid ${W.ink}`,
            padding: 24,
            boxShadow: `3px 3px 0 ${W.ink3}`,
          }}
        >
          <Mono>p. 86</Mono>
          <div style={{ height: 14 }} />
          <Scribble lines={14} w="92%" gap={9} />
        </div>
        <div
          style={{
            width: 320,
            height: 460,
            background: W.paper,
            border: `1.5px solid ${W.ink}`,
            padding: 24,
            boxShadow: `3px 3px 0 ${W.ink3}`,
          }}
        >
          <Scribble lines={14} w="92%" gap={9} />
          <div style={{ height: 16 }} />
          <Mono style={{ float: "right" }}>p. 87</Mono>
        </div>
        <Hand size={20} color={W.ink2}>
          ›
        </Hand>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          borderTop: `1.5px solid ${W.ink}`,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Mono>p. 87 / 324</Mono>
        <div
          style={{
            flex: 1,
            height: 4,
            background: W.ink3,
            borderRadius: 2,
            position: "relative",
          }}
        >
          <div
            style={{
              width: "27%",
              height: "100%",
              background: W.accent,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "27%",
              top: -4,
              width: 12,
              height: 12,
              background: W.ink,
              borderRadius: "50%",
            }}
          />
        </div>
        <Mono>27%</Mono>
        <div style={{ width: 1, height: 24, background: W.ink3 }} />
        <Pill>contents</Pill>
        <Pill>flat ⇄ flip</Pill>
      </div>

      <Note x={680} y={300} dx={120} dy={-30} side="right">
        Two-page spread; click corners or arrows to flip. Saves position every
        2s.
      </Note>
      <Note x={120} y={620} dx={-30} dy={-50} side="left">
        Scrubber jumps; contents opens chapter list.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 05 — READER (Bold)
// ════════════════════════════════════════════════════════════════
export function ReaderBold() {
  return (
    <Frame>
      <div style={{ position: "absolute", inset: 0, background: W.bar }} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) perspective(1200px) rotateX(8deg)",
          display: "flex",
        }}
      >
        <div
          style={{
            width: 380,
            height: 520,
            background: W.paper,
            border: `1.5px solid ${W.ink}`,
            padding: "32px 40px",
            boxShadow: `8px 8px 0 ${W.ink3}`,
            transform: "rotateY(-4deg)",
            transformOrigin: "right center",
          }}
        >
          <Mono>chapter v · p. 86</Mono>
          <div style={{ height: 18 }} />
          <Scribble lines={16} w="92%" gap={10} />
        </div>
        <div
          style={{
            width: 380,
            height: 520,
            background: W.paper,
            border: `1.5px solid ${W.ink}`,
            borderLeft: "none",
            padding: "32px 40px",
            boxShadow: `8px 8px 0 ${W.ink3}`,
            transform: "rotateY(4deg)",
            transformOrigin: "left center",
          }}
        >
          <Scribble lines={16} w="92%" gap={10} />
          <Mono style={{ float: "right", marginTop: 12 }}>p. 87</Mono>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 24,
          left: 32,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Hand size={13} color={W.ink2}>
          ← shelf
        </Hand>
        <span style={{ marginLeft: 16 }}>
          <Mono>Beloved · Morrison</Mono>
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 32,
          display: "flex",
          gap: 10,
        }}
      >
        <Pill>aa</Pill>
        <Pill>contents</Pill>
        <Pill filled>3D</Pill>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "8px 20px",
          background: W.paper,
          border: `1.5px solid ${W.ink}`,
          borderRadius: 999,
          boxShadow: `3px 3px 0 ${W.ink3}`,
        }}
      >
        <Hand size={14} color={W.ink2}>
          ‹
        </Hand>
        <Mono>87 / 324</Mono>
        <div
          style={{
            width: 200,
            height: 3,
            background: W.ink3,
            borderRadius: 2,
          }}
        >
          <div
            style={{ width: "27%", height: "100%", background: W.accent }}
          />
        </div>
        <Hand size={14} color={W.ink2}>
          ›
        </Hand>
      </div>

      <Note x={650} y={120} dx={120} dy={20} side="right">
        Chrome fades after 3s of no input. Book is the entire interface.
      </Note>
      <Note x={400} y={400} dx={-60} dy={120} side="left">
        Drag the corner to flip; pages have weight + curl. The hero moment.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 06 — COMMUNITY (Safe)
// ════════════════════════════════════════════════════════════════
export function CommunitySafe() {
  const shelves = [
    { name: "Marina K.", count: 24, theme: "modernist novels" },
    { name: "Ian P.", count: 13, theme: "sci-fi" },
    { name: "Anonymous", count: 8, theme: "philosophy" },
    { name: "Reza T.", count: 41, theme: "mixed" },
    { name: "June W.", count: 19, theme: "poetry" },
    { name: "Olu A.", count: 32, theme: "history" },
  ];
  return (
    <Frame>
      <AppBar active="community" />
      <div style={{ padding: "24px 32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div>
            <Display size={32} style={{ display: "block" }}>
              Community shelves
            </Display>
            <Hand size={14} color={W.ink2}>
              Public bookshelves shared by other readers.
            </Hand>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Pill filled>recent</Pill>
            <Pill>most books</Pill>
            <Pill>random</Pill>
          </div>
        </div>

        <div style={{ height: 24 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {shelves.map((s, i) => (
            <div
              key={i}
              style={{
                border: `1.5px solid ${W.ink}`,
                borderRadius: 6,
                padding: 16,
                background: W.bar,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  height: 110,
                  marginBottom: 12,
                }}
              >
                {Array.from({ length: 9 }).map((_, j) => (
                  <Spine key={j} h={70 + ((j * 7) % 35)} w={16} title="" />
                ))}
              </div>
              <Display size={18} style={{ display: "block" }}>
                {s.name}
              </Display>
              <Hand size={11} color={W.ink2} italic>
                {s.theme} · {s.count} books
              </Hand>
            </div>
          ))}
        </div>
      </div>

      <Note x={400} y={300} dx={50} dy={-40} side="right">
        Each card = a mini 3D shelf preview. Click to browse that shelf.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 06 — COMMUNITY (Bold)
// ════════════════════════════════════════════════════════════════
export function CommunityBold() {
  return (
    <Frame>
      <AppBar active="community" />

      <div style={{ padding: "28px 32px 16px" }}>
        <Mono>1,284 public books · 312 readers</Mono>
        <Display
          size={48}
          style={{ display: "block", lineHeight: 1.0, marginTop: 8 }}
        >
          The shared library.
        </Display>
      </div>

      <div
        style={{
          padding: "0 32px",
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Pill filled>all</Pill>
        <Pill>fiction</Pill>
        <Pill>poetry</Pill>
        <Pill>essays</Pill>
        <Pill>history</Pill>
        <Pill>philosophy</Pill>
        <div style={{ flex: 1 }} />
        <Pill>by spine color ⌄</Pill>
        <Pill>added this week</Pill>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 240,
          bottom: 0,
          background: W.bar,
          padding: "24px 0",
        }}
      >
        {[0, 1].map((row) => (
          <div
            key={row}
            style={{ position: "relative", height: 180, marginBottom: 18 }}
          >
            <div
              style={{
                position: "absolute",
                left: 32,
                right: 32,
                bottom: 0,
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
              }}
            >
              {Array.from({ length: 24 }).map((_, j) => (
                <Spine
                  key={j}
                  h={120 + (((j + row * 5) * 11) % 50)}
                  w={20 + (j % 3) * 6}
                  title=""
                />
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                left: 32,
                right: 32,
                bottom: -6,
                height: 8,
                background: W.ink,
                borderRadius: 1,
              }}
            />
          </div>
        ))}
      </div>

      <Note x={420} y={420} dx={50} dy={-60} side="right">
        Single endless shelf. Hover any spine → see who shared it. No &ldquo;card
        grid&rdquo; between you and the books.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 07 — SETTINGS (Safe)
// ════════════════════════════════════════════════════════════════
export function SettingsSafe() {
  return (
    <Frame>
      <AppBar active="settings" />
      <div style={{ display: "flex", height: "calc(100% - 56px)" }}>
        <div
          style={{
            width: 220,
            borderRight: `1.5px solid ${W.ink}`,
            padding: 24,
            background: W.bar,
          }}
        >
          <Mono>settings</Mono>
          <div style={{ height: 16 }} />
          {["Profile", "Reading", "Storage", "Privacy", "Danger zone"].map(
            (s, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 10px",
                  borderRadius: 4,
                  background: i === 0 ? W.paper : "transparent",
                  border: i === 0 ? `1.2px solid ${W.ink}` : "none",
                  fontFamily: W.hand,
                  fontSize: 14,
                  color: i === 4 ? "#a3393a" : W.ink,
                  marginBottom: 4,
                }}
              >
                {s}
              </div>
            ),
          )}
        </div>

        <div style={{ flex: 1, padding: 32, overflow: "hidden" }}>
          <Display size={28} style={{ display: "block" }}>
            Profile
          </Display>
          <div style={{ height: 24 }} />

          <div
            style={{ display: "flex", gap: 24, alignItems: "flex-start" }}
          >
            <div>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  border: `1.5px solid ${W.ink}`,
                  background: W.fill,
                }}
              />
              <div style={{ height: 6 }} />
              <Hand size={11} color={W.ink2}>
                change
              </Hand>
            </div>
            <div style={{ flex: 1 }}>
              <Mono>display name</Mono>
              <Box w="100%" h={40} rounded={4} style={{ marginTop: 4 }}>
                <div
                  style={{ padding: 10, fontFamily: W.hand, fontSize: 14 }}
                >
                  marina.k
                </div>
              </Box>
              <div style={{ height: 14 }} />
              <Mono>email</Mono>
              <Box w="100%" h={40} rounded={4} style={{ marginTop: 4 }}>
                <div
                  style={{
                    padding: 10,
                    fontFamily: W.hand,
                    fontSize: 14,
                    color: W.ink3,
                  }}
                >
                  marina@example.com (read-only)
                </div>
              </Box>
            </div>
          </div>

          <div style={{ height: 28 }} />
          <Display size={20} style={{ display: "block" }}>
            Storage
          </Display>
          <div style={{ height: 12 }} />
          <Mono>4.2 GB / 1.0 GB free tier · 13 books</Mono>
          <div style={{ height: 8 }} />
          <div
            style={{
              width: "100%",
              height: 8,
              background: W.ink3,
              borderRadius: 4,
            }}
          >
            <div
              style={{
                width: "88%",
                height: "100%",
                background: "#a3393a",
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ height: 18 }} />
          <Btn>save</Btn>
        </div>
      </div>

      <Note x={840} y={290} dx={-40} dy={-60} side="left">
        Storage warning when over free tier. Inline, not a modal.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 07 — SETTINGS (Bold)
// ════════════════════════════════════════════════════════════════
export function SettingsBold() {
  const sections = [
    {
      kicker: "i",
      title: "The reader",
      body: "marina.k · marina@example.com",
      cta: "edit name",
    },
    {
      kicker: "ii",
      title: "The shelves",
      body: "13 private books · 4 public · 4.2 GB used",
      cta: "manage storage",
    },
    {
      kicker: "iii",
      title: "The bindings",
      body: "magic-link sign-in · Google connected",
      cta: "unlink Google",
    },
    {
      kicker: "iv",
      title: "The privacy",
      body: "public shelf is opt-in per book · DMCA contact",
      cta: "review",
    },
  ];
  return (
    <Frame>
      <AppBar active="settings" />
      <div style={{ padding: "40px 80px", maxWidth: 800, margin: "0 auto" }}>
        <Mono>colophon</Mono>
        <div style={{ height: 8 }} />
        <Display size={42} style={{ display: "block" }}>
          About this reader.
        </Display>
        <Hand size={14} color={W.ink2} italic>
          The back matter — your account, your shelves, the small print.
        </Hand>

        <div style={{ height: 36 }} />

        {sections.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 24,
              padding: "20px 0",
              borderTop: `1px solid ${W.ink3}`,
            }}
          >
            <div style={{ width: 32, paddingTop: 4 }}>
              <Display size={18} color={W.ink2}>
                {s.kicker}.
              </Display>
            </div>
            <div style={{ flex: 1 }}>
              <Display size={22} style={{ display: "block" }}>
                {s.title}
              </Display>
              <Hand size={14} color={W.ink2}>
                {s.body}
              </Hand>
            </div>
            <div>
              <Hand
                size={13}
                color={W.ink}
                style={{
                  borderBottom: `1.2px solid ${W.ink}`,
                  paddingBottom: 2,
                }}
              >
                {s.cta} →
              </Hand>
            </div>
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${W.ink3}`, padding: "20px 0" }}>
          <Display size={18} color="#a3393a" style={{ display: "block" }}>
            Burn the library.
          </Display>
          <Hand size={13} color={W.ink2}>
            Delete account, all books, all reading state. Cannot be undone.
          </Hand>
          <div style={{ height: 10 }} />
          <Btn
            style={{
              borderColor: "#a3393a",
              color: "#a3393a",
              boxShadow: "none",
            }}
          >
            delete everything
          </Btn>
        </div>
      </div>

      <Note x={120} y={200} dx={-40} dy={50} side="left">
        Settings are presented like a book&rsquo;s back matter — sections numbered
        i, ii, iii.
      </Note>
    </Frame>
  );
}

// ════════════════════════════════════════════════════════════════
// 00 — README
// ════════════════════════════════════════════════════════════════
export function ReadmeFrame() {
  return (
    <Frame w={520} h={720}>
      <div style={{ padding: "40px 36px" }}>
        <Mono>read me first</Mono>
        <div style={{ height: 8 }} />
        <Display size={44} style={{ display: "block", lineHeight: 1.0 }}>
          Wireframes for
          <br />
          KnowHow.
        </Display>
        <div style={{ height: 20 }} />
        <Hand
          size={15}
          color={W.ink2}
          style={{ display: "block", lineHeight: 1.5 }}
        >
          Two variants per screen — a <i>safe</i> direction using conventional
          patterns, and a <i>bold</i> direction that puts the physicality of
          the book first.
        </Hand>
        <div style={{ height: 24 }} />
        <Squiggle color={W.accent} height={8} />
        <div style={{ height: 24 }} />
        <Mono>screens</Mono>
        <div style={{ height: 10 }} />
        {[
          "01 · Landing",
          "02 · Login",
          "03 · Shelf",
          "04 · Upload",
          "05 · Reader",
          "06 · Community",
          "07 · Settings",
        ].map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: `1px dashed ${W.ink3}`,
            }}
          >
            <Hand size={14}>{s}</Hand>
            <Hand size={12} color={W.ink2}>
              safe · bold
            </Hand>
          </div>
        ))}
        <div style={{ height: 24 }} />
        <Mono>method</Mono>
        <div style={{ height: 8 }} />
        <Hand
          size={13}
          color={W.ink2}
          style={{ display: "block", lineHeight: 1.5 }}
        >
          Hand-drawn lines on warm paper. Layout, hierarchy, and copy are real;
          visual finish is deliberately rough so we argue about structure, not
          pixels.
        </Hand>
        <div style={{ height: 16 }} />
        <Hand size={13} color={W.ink2} italic>
          → flip the Tweaks panel on (toolbar, bottom-right) to swap palette:
          paper, leather, midnight, library, marble.
        </Hand>
      </div>
    </Frame>
  );
}
