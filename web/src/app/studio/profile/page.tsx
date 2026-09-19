"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Lookups } from "@/lib/types";

const emptyForm = {
  stage_name: "",
  slug: "",
  bio: "",
  city: "",
  state: "",
  country: "India",
  discipline_id: "",
  genre_ids: [] as number[],
  language_ids: [] as number[],
  skills: "",
  instagram: "",
  youtube: "",
  website: "",
  available_for_collaboration: false,
  available_for_hire: false,
  starting_rate_inr: "",
};

export default function StudioProfilePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    api.lookups().then(setLookups).catch(() => undefined);
    api
      .getMyProfile()
      .then((profile) => {
        setForm({
          stage_name: profile.stage_name || "",
          slug: profile.slug || "",
          bio: profile.bio || "",
          city: profile.city || "",
          state: profile.state || "",
          country: profile.country || "India",
          discipline_id: profile.discipline ? String(profile.discipline.id) : "",
          genre_ids: profile.genres.map((item) => item.id),
          language_ids: profile.languages.map((item) => item.id),
          skills: (profile.skills || []).join(", "),
          instagram: profile.social_links?.instagram || "",
          youtube: profile.social_links?.youtube || "",
          website: profile.social_links?.website || "",
          available_for_collaboration: profile.available_for_collaboration,
          available_for_hire: profile.available_for_hire,
          starting_rate_inr: profile.starting_rate_inr ? String(profile.starting_rate_inr) : "",
        });
      })
      .catch(() => undefined);
  }, []);

  function toggleId(key: "genre_ids" | "language_ids", id: number) {
    setForm((current) => {
      const next = current[key].includes(id)
        ? current[key].filter((item) => item !== id)
        : [...current[key], id];
      return { ...current, [key]: next };
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const saved = await api.saveMyProfile({
        stage_name: form.stage_name,
        slug: form.slug || undefined,
        bio: form.bio,
        city: form.city,
        state: form.state,
        country: form.country,
        discipline_id: form.discipline_id ? Number(form.discipline_id) : null,
        genre_ids: form.genre_ids,
        language_ids: form.language_ids,
        skills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        social_links: {
          instagram: form.instagram,
          youtube: form.youtube,
          website: form.website,
        },
        available_for_collaboration: form.available_for_collaboration,
        available_for_hire: form.available_for_hire,
        starting_rate_inr: form.starting_rate_inr ? Number(form.starting_rate_inr) : null,
      });
      setStatus("Saved. Your public page is live.");
      if (saved.slug) setForm((current) => ({ ...current, slug: saved.slug }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function onImage(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      await api.uploadImage(file);
      setStatus("Image updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image. Save the profile first.");
    }
  }

  if (!ready || !user) return null;

  return (
    <div>
      <h1 className="font-serif text-4xl">Profile</h1>
      <p className="mt-2 text-muted">This is the identity people find in the directory.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Stage name">
          <input
            required
            value={form.stage_name}
            onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
            className="field-input"
          />
        </Field>
        <Field label="Public URL slug">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="your-name"
            className="field-input"
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="field-input"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field-input" />
          </Field>
          <Field label="State">
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="field-input" />
          </Field>
        </div>
        <Field label="Discipline">
          <select
            value={form.discipline_id}
            onChange={(e) => setForm({ ...form, discipline_id: e.target.value })}
            className="field-input"
          >
            <option value="">Select</option>
            {lookups?.disciplines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm text-muted">Genres</legend>
          <div className="flex flex-wrap gap-2">
            {lookups?.genres.map((item) => (
              <label key={item.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.genre_ids.includes(item.id)}
                  onChange={() => toggleId("genre_ids", item.id)}
                />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm text-muted">Languages</legend>
          <div className="flex flex-wrap gap-2">
            {lookups?.languages.map((item) => (
              <label key={item.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.language_ids.includes(item.id)}
                  onChange={() => toggleId("language_ids", item.id)}
                />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Skills (comma separated)">
          <input
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="field-input"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram">
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="field-input" />
          </Field>
          <Field label="YouTube">
            <input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} className="field-input" />
          </Field>
          <Field label="Website">
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="field-input" />
          </Field>
        </div>
        <Field label="Starting rate (INR)">
          <input
            type="number"
            min="0"
            value={form.starting_rate_inr}
            onChange={(e) => setForm({ ...form, starting_rate_inr: e.target.value })}
            className="field-input"
          />
        </Field>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available_for_hire}
              onChange={(e) => setForm({ ...form, available_for_hire: e.target.checked })}
            />
            Available for hire
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available_for_collaboration}
              onChange={(e) => setForm({ ...form, available_for_collaboration: e.target.checked })}
            />
            Available to collaborate
          </label>
        </div>
        <Field label="Profile image">
          <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        {status && <p className="text-sm text-gold">{status}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-on-gold"
          >
            {busy ? "Saving…" : "Save profile"}
          </button>
          {form.slug && (
            <a href={`/artist/${form.slug}`} className="text-sm text-gold hover:underline">
              View public page
            </a>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
