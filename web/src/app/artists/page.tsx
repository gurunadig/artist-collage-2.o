"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArtistCard } from "@/components/ArtistCard";
import { api } from "@/lib/api";
import type { Artist, Lookups } from "@/lib/types";

export default function DirectoryPage() {
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [availability, setAvailability] = useState("");

  const params = useMemo(
    () => ({ q, city, discipline, genre, language, availability }),
    [q, city, discipline, genre, language, availability],
  );

  useEffect(() => {
    api.lookups().then(setLookups).catch(() => undefined);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLoading(true);
      api
        .artists(params)
        .then((data) => {
          setArtists(data.results);
          setCount(data.count);
          setError("");
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [params]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-4xl">Artist directory</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Search by intent — city, discipline, language, or availability.
      </p>
      <form onSubmit={onSearch} className="mt-8 grid gap-3 md:grid-cols-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kannada rapper in Bangalore"
          className="md:col-span-2 rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-gold"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-gold"
        />
        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className="rounded-xl border border-line bg-panel px-4 py-3 outline-none"
        >
          <option value="">Discipline</option>
          {lookups?.disciplines.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-xl border border-line bg-panel px-4 py-3 outline-none"
        >
          <option value="">Genre</option>
          {lookups?.genres.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-line bg-panel px-4 py-3 outline-none"
        >
          <option value="">Language</option>
          {lookups?.languages.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="rounded-xl border border-line bg-panel px-4 py-3 outline-none md:col-span-2"
        >
          <option value="">Availability</option>
          <option value="hire">Available for hire</option>
          <option value="collab">Available to collaborate</option>
        </select>
      </form>
      <p className="mt-6 text-sm text-muted">
        {loading ? "Searching…" : `${count} artist${count === 1 ? "" : "s"}`}
      </p>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <ArtistCard key={artist.slug} artist={artist} />
        ))}
      </div>
    </div>
  );
}
