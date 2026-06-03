import { redirect } from "next/navigation";

export default function WalletsPage() {
  redirect("/finance?tab=wallets");
}
