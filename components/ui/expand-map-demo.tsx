import { LocationMap } from "@/components/ui/expand-map";

export default function ExpandMapDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E2E4E8] p-5">
      <LocationMap location="Dalmine, BG" coordinates="45.65° N · 9.60° E" />
    </main>
  );
}
