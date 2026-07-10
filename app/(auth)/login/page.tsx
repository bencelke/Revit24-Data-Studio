import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getFirebaseEnvStatus } from "@/lib/firebase/firebaseEnv";

export const metadata: Metadata = {
  title: "Sign In",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const envStatus = getFirebaseEnvStatus();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm initialEnvStatus={envStatus} />
    </div>
  );
}
