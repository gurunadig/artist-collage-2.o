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

export type Track = {
  id: string;
  slug: string;
  title: string;
  artist_slug: string;
  artist_name: string;
  artwork_url: string | null;
  preview_url: string | null;
  preview_seconds: number;
  preview_start_seconds?: number;
  duration_seconds?: number | null;
  has_preview_audio?: boolean;
  price_inr: number;
  is_published: boolean;
  has_mp3: boolean;
  has_wav: boolean;
  owned?: boolean;
  stream_url?: string | null;
  download_mp3_url?: string | null;
  download_wav_url?: string | null;
  created_at: string;
};

export type CheckoutOrder = {
  id: string;
  status: string;
  provider: string;
  amount_inr: number;
  platform_fee_inr: number;
  artist_earnings_inr: number;
  razorpay_order_id: string;
  key_id: string;
  amount_paise: number;
  mock: boolean;
  track_title: string;
  track_slug: string;
  artist_slug: string;
  artist_name: string;
};

export type Sale = {
  id: string;
  status: string;
  amount_inr: number;
  platform_fee_inr: number;
  artist_earnings_inr: number;
  track_title: string;
  track_slug: string;
  artist_slug: string;
  created_at: string;
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
  tracks?: Track[];
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
