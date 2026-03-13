import { ReactNode } from "react";
import NavBar from "@/components/NavBar";

export default function SalonLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      {children}
      <NavBar />
    </main>
  );
}
