import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthForm
      purpose="login"
      title="Sign in"
      subtitle="Use a phone number or email. We will send a one-time code."
      altHref="/signup"
      altLabel="New here? Create a profile"
    />
  );
}
