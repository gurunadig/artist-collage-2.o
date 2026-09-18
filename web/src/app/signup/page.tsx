import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create your profile" };

export default function SignupPage() {
  return (
    <AuthForm
      purpose="signup"
      title="Create your profile"
      subtitle="Start with a phone number or email. Then add the work people should find."
      altHref="/login"
      altLabel="Already have an account? Sign in"
    />
  );
}
