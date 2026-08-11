import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Your Story | History, Rewritten", description: "Explore evidence-aware alternate histories through branching simulations." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
