/** Server component: renders a lesson's video from a pasted URL.
 *  Handles YouTube, Vimeo, direct media files, and falls back to a link
 *  for anything else (so we never embed a URL that would be blocked). */

type Embed =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "link"; src: string };

function toEmbed(raw: string): Embed {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "link", src: raw };
  }
  const host = url.hostname.replace(/^www\./, "");

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? url.pathname.split("/").pop();
    if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }

  // Vimeo
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) {
      return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
  }
  if (host === "player.vimeo.com") {
    return { kind: "iframe", src: raw };
  }

  // Direct media file
  if (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname)) {
    return { kind: "video", src: raw };
  }

  return { kind: "link", src: raw };
}

export function VideoEmbed({ url }: { url: string }) {
  const embed = toEmbed(url);

  if (embed.kind === "link") {
    return (
      <a
        href={embed.src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md border border-[color:var(--color-ink)]/25 px-3 py-2 text-sm hover:border-[color:var(--color-gold)]/60"
      >
        Open video ↗
      </a>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-[color:var(--color-ink)]/15 bg-black">
      {embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <video src={embed.src} controls className="h-full w-full" />
      )}
    </div>
  );
}
