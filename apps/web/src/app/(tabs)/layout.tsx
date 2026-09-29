import { TabBar } from "@/components/ui/tab-bar";

/** Layar tab (Trips, Card, Profile): konten + tab bar bawah. */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <TabBar />
    </>
  );
}
