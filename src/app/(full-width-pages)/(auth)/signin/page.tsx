import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Masuk | BISA Admin",
  description: "Login panel admin BISA",
};

export default function SignIn() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-gray-500">Memuat...</div>}>
      <SignInForm />
    </Suspense>
  );
}
