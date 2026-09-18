import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist directory",
  description: "Find independent artists by city, discipline, language, and availability.",
};

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
