from django.core.management.base import BaseCommand
from django.utils.text import slugify

from accounts.models import User
from artists.models import ArtistProfile, Discipline, Genre, Language, PortfolioItem

DISCIPLINES = ["Rapper", "Vocalist", "Producer", "Guitarist", "Drummer", "DJ", "Songwriter", "Composer"]
GENRES = [
    "Hip-hop",
    "Rap",
    "Indie",
    "Folk",
    "Rock",
    "Pop",
    "Electronic",
    "Classical fusion",
    "R&B",
    "Playback",
]
LANGUAGES = [
    ("Kannada", "kn"),
    ("Hindi", "hi"),
    ("English", "en"),
    ("Tamil", "ta"),
    ("Telugu", "te"),
    ("Malayalam", "ml"),
    ("Marathi", "mr"),
    ("Bengali", "bn"),
]

ARTISTS = [
    {
        "stage_name": "Guru Nadig",
        "email": "guru@example.com",
        "phone": "+919900000001",
        "city": "Bangalore",
        "state": "Karnataka",
        "discipline": "Rapper",
        "genres": ["Hip-hop", "Rap"],
        "languages": ["Kannada", "English"],
        "skills": ["Writing", "Performance", "Topline"],
        "bio": "Kannada rapper based in Bangalore. Available for features, live sets and brand work.",
        "hire": True,
        "collab": True,
        "rate": 20000,
        "featured": True,
        "social": {"instagram": "https://instagram.com/gurunadig", "youtube": "https://youtube.com"},
        "portfolio": [{"title": "Suchane", "url": "https://example.com/suchane", "description": "Single"}],
    },
    {
        "stage_name": "Priya Rao",
        "email": "priya@example.com",
        "phone": "+919900000002",
        "city": "Mumbai",
        "state": "Maharashtra",
        "discipline": "Vocalist",
        "genres": ["Pop", "Playback", "R&B"],
        "languages": ["Hindi", "English", "Marathi"],
        "skills": ["Session vocals", "Harmony", "Topline"],
        "bio": "Session vocalist for film, ads and independent records.",
        "hire": True,
        "collab": True,
        "rate": 25000,
        "featured": True,
        "social": {"instagram": "https://instagram.com/priyarao"},
        "portfolio": [],
    },
    {
        "stage_name": "Arjun Menon",
        "email": "arjun@example.com",
        "phone": "+919900000003",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "discipline": "Producer",
        "genres": ["Hip-hop", "Electronic", "Pop"],
        "languages": ["Tamil", "English"],
        "skills": ["Beatmaking", "Mixing", "Sound design"],
        "bio": "Producer and mixer working with independent Tamil and pan-Indian artists.",
        "hire": True,
        "collab": True,
        "rate": 35000,
        "featured": False,
        "social": {"website": "https://example.com/arjun"},
        "portfolio": [],
    },
    {
        "stage_name": "Meera Joshi",
        "email": "meera@example.com",
        "phone": "+919900000004",
        "city": "Pune",
        "state": "Maharashtra",
        "discipline": "Vocalist",
        "genres": ["Folk", "Indie"],
        "languages": ["Marathi", "Hindi"],
        "skills": ["Folk vocals", "Live performance"],
        "bio": "Marathi folk and indie vocalist. Open to collaborations that respect source material.",
        "hire": True,
        "collab": True,
        "rate": 15000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Kabir Ali",
        "email": "kabir@example.com",
        "phone": "+919900000005",
        "city": "Delhi",
        "state": "Delhi",
        "discipline": "Songwriter",
        "genres": ["Rock", "Indie"],
        "languages": ["Hindi", "English"],
        "skills": ["Guitar", "Lyric writing", "Arrangement"],
        "bio": "Indie rock songwriter looking for producers and a live band.",
        "hire": False,
        "collab": True,
        "rate": 12000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Sandhya Iyer",
        "email": "sandhya@example.com",
        "phone": "+919900000006",
        "city": "Hyderabad",
        "state": "Telangana",
        "discipline": "Vocalist",
        "genres": ["Playback", "Classical fusion"],
        "languages": ["Telugu", "Tamil", "Hindi"],
        "skills": ["Carnatic", "Playback", "Live"],
        "bio": "Classically trained vocalist for playback and fusion work.",
        "hire": True,
        "collab": False,
        "rate": 40000,
        "featured": True,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Rohan Das",
        "email": "rohan@example.com",
        "phone": "+919900000007",
        "city": "Kolkata",
        "state": "West Bengal",
        "discipline": "Producer",
        "genres": ["Hip-hop", "Electronic"],
        "languages": ["Bengali", "English", "Hindi"],
        "skills": ["Beats", "Sampling", "Mix"],
        "bio": "Beatmaker. Sends wav stems. Available for rap features and ads.",
        "hire": True,
        "collab": True,
        "rate": 8000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Ananya Krishnan",
        "email": "ananya@example.com",
        "phone": "+919900000008",
        "city": "Bangalore",
        "state": "Karnataka",
        "discipline": "Composer",
        "genres": ["Classical fusion", "Indie"],
        "languages": ["Kannada", "Tamil", "English"],
        "skills": ["Composition", "Violin", "Score"],
        "bio": "Composer for independent film and live ensembles.",
        "hire": True,
        "collab": True,
        "rate": 50000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Vikram Sethi",
        "email": "vikram@example.com",
        "phone": "+919900000009",
        "city": "Chandigarh",
        "state": "Chandigarh",
        "discipline": "Guitarist",
        "genres": ["Rock", "Pop", "Folk"],
        "languages": ["Hindi", "English"],
        "skills": ["Session guitar", "Live"],
        "bio": "Session guitarist available for studio dates and tours.",
        "hire": True,
        "collab": True,
        "rate": 10000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Fatima Khan",
        "email": "fatima@example.com",
        "phone": "+919900000010",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "discipline": "Songwriter",
        "genres": ["Pop", "R&B", "Indie"],
        "languages": ["Hindi", "English"],
        "skills": ["Topline", "Lyrics", "Piano"],
        "bio": "Topliner and songwriter. Writes in Hindi and English.",
        "hire": True,
        "collab": True,
        "rate": 18000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Joel Fernandes",
        "email": "joel@example.com",
        "phone": "+919900000011",
        "city": "Panaji",
        "state": "Goa",
        "discipline": "Drummer",
        "genres": ["Rock", "Indie", "Pop"],
        "languages": ["English", "Hindi"],
        "skills": ["Live drums", "Studio"],
        "bio": "Drummer for hire. Tours and studio, Goa and Mumbai.",
        "hire": True,
        "collab": True,
        "rate": 9000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
    {
        "stage_name": "Nisha Patel",
        "email": "nisha@example.com",
        "phone": "+919900000012",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "discipline": "DJ",
        "genres": ["Electronic", "Hip-hop"],
        "languages": ["Hindi", "English"],
        "skills": ["DJ", "Live sets", "Production"],
        "bio": "DJ and electronic producer for clubs, brands and independent nights.",
        "hire": True,
        "collab": False,
        "rate": 22000,
        "featured": False,
        "social": {},
        "portfolio": [],
    },
]


class Command(BaseCommand):
    help = "Seed lookup tables, a demo admin, and 12 independent Indian artists."

    def handle(self, *args, **options):
        disciplines = {name: Discipline.objects.get_or_create(name=name, defaults={"slug": slugify(name)})[0] for name in DISCIPLINES}
        genres = {name: Genre.objects.get_or_create(name=name, defaults={"slug": slugify(name)})[0] for name in GENRES}
        languages = {
            name: Language.objects.get_or_create(name=name, defaults={"slug": slugify(name), "code": code})[0]
            for name, code in LANGUAGES
        }

        admin_user, created = User.objects.get_or_create(
            email="admin@artistcollage.com",
            defaults={
                "username": "admin@artistcollage.com",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_user.set_password("admin12345")
            admin_user.save()
            self.stdout.write("Created admin@artistcollage.com / admin12345")
        else:
            self.stdout.write("Admin user already exists")

        for row in ARTISTS:
            user, _ = User.objects.get_or_create(
                email=row["email"],
                defaults={
                    "username": row["email"],
                    "phone": row["phone"],
                    "role": User.Role.ARTIST,
                },
            )
            if not user.phone:
                user.phone = row["phone"]
                user.role = User.Role.ARTIST
                user.save()

            profile, _ = ArtistProfile.objects.update_or_create(
                user=user,
                defaults={
                    "stage_name": row["stage_name"],
                    "slug": slugify(row["stage_name"]),
                    "bio": row["bio"],
                    "city": row["city"],
                    "state": row["state"],
                    "country": "India",
                    "discipline": disciplines[row["discipline"]],
                    "skills": row["skills"],
                    "social_links": row["social"],
                    "available_for_collaboration": row["collab"],
                    "available_for_hire": row["hire"],
                    "starting_rate_inr": row["rate"],
                    "verification_status": ArtistProfile.Verification.VERIFIED,
                    "is_featured": row["featured"],
                },
            )
            profile.genres.set([genres[name] for name in row["genres"]])
            profile.languages.set([languages[name] for name in row["languages"]])
            profile.portfolio_items.all().delete()
            for index, item in enumerate(row["portfolio"]):
                PortfolioItem.objects.create(
                    artist=profile,
                    title=item["title"],
                    url=item.get("url", ""),
                    description=item.get("description", ""),
                    sort_order=index,
                )

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(ARTISTS)} artists."))
