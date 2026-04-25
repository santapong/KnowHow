import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KnowHow — read your novels in 3D",
    template: "%s · KnowHow",
  },
  description:
    "Upload your PDFs, see them as books on a 3D bookshelf, and read them with realistic page flips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <noscript>
          <div
            style={{
              padding: "12px 16px",
              background: "#2a1810",
              color: "#f4ecd8",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            KnowHow needs JavaScript to render the 3D shelf. Please enable it.
          </div>
        </noscript>
      </body>
    </html>
  );
}
