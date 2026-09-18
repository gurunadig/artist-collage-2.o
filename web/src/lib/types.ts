export type Role = "fan" | "artist" | "admin";

export type NamedSlug = {
  id: number;
  name: string;
  slug: string;
  code?: string;
};

export type PortfolioItem = {
  id?: string;
  title: string;
  url: string;
  description: string;
  sort_order?: number;
};

export type Artist = {
  slug: string;
  stage_name: string;
  city: string;
  state: string;
  country: string;
  discipline: NamedSlug | null;
  genres: NamedSlug[];
  languages: NamedSlug[];
  image_url: string | null;
  available_for_collaboration: boolean;
  available_for_hire: boolean;
  starting_rate_inr: number | null;
  verification_status: "pending" | "verified" | "rejected";
  is_featured: boolean;
  bio?: string;
  skills?: string[];
  social_links?: Record<string, string>;
  portfolio_items?: PortfolioItem[];
};

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  is_suspended: boolean;
  date_joined: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Lookups = {
  disciplines: NamedSlug[];
  genres: NamedSlug[];
  languages: NamedSlug[];
};
