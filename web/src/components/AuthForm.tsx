"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Props = {
  purpose: "login" | "signup";
  title: string;
  subtitle: string;
  altHref: string;
  altLabel: string;
};

export function AuthForm({ purpose, title, subtitle, altHref, altLabel }: Props) {
  const router = useRouter();
  const { login } = useAuth();
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload =
        channel === "email"
          ? { email, purpose }
          : { phone, purpose };
      const result = await api.requestOtp(payload);
      setSent(true);
      setHint(result.dev_code ? `Dev code: ${result.dev_code}` : "Code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload =
        channel === "email"
          ? { email, purpose, code }
          : { phone, purpose, code };
      const result = await api.verifyOtp(payload);
      login(result.access, result.refresh, result.user);
      router.push("/studio/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-4xl">{title}</h1>
      <p className="mt-3 text-muted">{subtitle}</p>
      <div className="mt-6 flex gap-2 text-sm">
        {(["phone", "email"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setChannel(item)}
            className={`rounded-full px-4 py-1.5 capitalize ${
              channel === item ? "bg-gold text-background" : "border border-line"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={sent ? verify : requestCode} className="mt-6 space-y-4">
        {channel === "phone" ? (
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone — 98765 43210"
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-gold"
          />
        ) : (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-gold"
          />
        )}
        {sent && (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-gold"
          />
        )}
        {hint && <p className="text-sm text-gold">{hint}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gold py-3 text-sm font-medium text-background disabled:opacity-60"
        >
          {busy ? "Please wait…" : sent ? "Verify and continue" : "Send code"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        <Link href={altHref} className="text-gold hover:underline">
          {altLabel}
        </Link>
      </p>
    </div>
  );
}
