import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | BISA Admin",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
