import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="mb-4 text-xs uppercase tracking-[0.28em] text-gold">Independent artists</p>
        <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          The professional home for independent artists.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Get discovered, get hired, collaborate, sell music directly, and keep creative agreements
          in one place. Not a social network. Not Spotify.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/artists"
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-on-gold"
          >
            Browse the directory
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-line px-6 py-3 text-sm hover:border-gold"
          >
            Create your profile
          </Link>
        </div>
      </section>
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
          {[
            {
              title: "Discover",
              copy: "A premium artist directory — find a Kannada rapper in Bangalore, or a vocalist for a ₹20,000 project.",
            },
            {
              title: "Operate",
              copy: "Profiles, hiring availability, contracts and payments. Built so artists can work, not post.",
            },
            {
              title: "Own",
              copy: "Fans buy music directly from the artist, download the file, and keep it. Support goes to the maker.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
