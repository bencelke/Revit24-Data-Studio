import type { Metadata } from "next";
import { LoginFormPlaceholder } from "@/components/auth/login-form-placeholder";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return <LoginFormPlaceholder />;
}
