import type { Metadata } from "next";
import { StudioNav } from "@/components/StudioNav";

export const metadata: Metadata = { title: "Studio" };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <StudioNav />
      {children}
    </div>
  );
}
