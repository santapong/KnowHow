import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowHow — read your novels in 3D",
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
      <body>{children}</body>
    </html>
  );
}
