import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM | BISA Admin",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
