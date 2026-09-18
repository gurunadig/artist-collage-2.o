# Artist Collage

> **The professional home for independent artists.**

Artist Collage is a professional marketplace and digital home for
independent artists --- built to help artists get discovered, get hired,
collaborate, sell their music directly, and manage creative agreements.

The product is intentionally focused. It is **not** a social network and
it is not trying to compete with Spotify.

The core loop is:

**Discover → Connect → Collaborate / Hire → Contract → Pay**

and for music:

**Discover → Preview → Buy → Download → Own**

------------------------------------------------------------------------

## 1. Product Vision

Artist Collage brings together the practical infrastructure an
independent artist needs in one place:

-   A professional artist directory
-   A shareable artist profile and portfolio
-   Discovery for hiring and collaboration
-   Direct-to-fan music sales
-   Digital music downloads
-   Artist subscriptions
-   Creative contracts
-   Payments and artist settlements
-   Reputation and reviews
-   Artist analytics and management tools

The underlying idea is simple:

> **Don't build another place for artists to post. Build a place where
> artists can actually operate.**

------------------------------------------------------------------------

# 2. Core Product

## A. Artist Directory

A modern, premium version of Yellow Pages for artists.

Artists can create professional profiles containing:

-   Artist / stage name
-   Profile image and branding
-   Location
-   Discipline
-   Genres
-   Languages
-   Skills
-   Portfolio
-   Music
-   Social links
-   Collaboration availability
-   Hiring availability
-   Starting rates
-   Verification status

Discovery should eventually support intent-based searches such as:

> Find a Kannada rapper in Bangalore available for collaboration.

or:

> Find a vocalist for a ₹20,000 project.

The directory is the foundation of the platform.

------------------------------------------------------------------------

## B. Artist Store

Artists can sell their music directly to fans.

Example:

**Track: Suchane**\
**Price: ₹50+**\
**Formats: MP3 + WAV**

The fan can:

1.  Discover the track
2.  Listen to a preview
3.  Purchase it
4.  Download the file
5.  Keep it in their personal music library

The philosophy is deliberately simple:

> **Buy music directly from the artist. Own the file. Support the
> artist.**

Future digital products can include:

-   Singles
-   EPs
-   Albums
-   Instrumentals
-   Acapellas
-   Stems
-   Sample packs
-   Beats
-   Presets
-   Other artist-created digital products

These are future possibilities, not Phase 1 requirements.

------------------------------------------------------------------------

## C. Contracts

The original Artist Collage contract idea returns.

Artists should be able to create structured creative agreements for:

-   Hiring
-   Production
-   Collaborations
-   Deliverables
-   Payment
-   Deadlines
-   Credits
-   Ownership
-   Usage rights
-   Revenue splits
-   Revisions
-   Termination

AI assists with drafting and explaining contracts.

The intended flow:

**Contract wizard → Structured contract → AI draft → Human review →
Final contract → Signature / acceptance → Stored record**

The AI should assist rather than replace human review.

------------------------------------------------------------------------

## D. Artist Subscriptions

The platform will have paid artist plans.

Initial model:

### Free

-   Artist profile
-   Directory listing
-   Basic portfolio
-   Discovery
-   Basic collaboration / hiring presence

### Pro

-   Storefront
-   Music sales
-   Contracts
-   Advanced profile
-   Analytics
-   More uploads
-   Professional tools
-   Other premium features

Monthly and yearly options can be offered.

Pricing will be validated after the first real users and transactions.

------------------------------------------------------------------------

## E. Payments

Razorpay will handle payments.

Razorpay Route can be used for marketplace-style payment routing and
artist settlements.

The platform should maintain its own internal financial records rather
than treating Razorpay as the accounting source of truth.

Core concepts:

-   Orders
-   Payments
-   Platform fees
-   Artist earnings
-   Transfers
-   Refunds
-   Settlements

------------------------------------------------------------------------

# 3. Business Model

Artist Collage can have multiple revenue streams.

### 1. Artist subscriptions

Artists pay for professional platform access and tools.

### 2. Music transaction commission

The platform takes a percentage from music sales.

A starting hypothesis:

-   Free artists: higher transaction commission
-   Pro artists: lower transaction commission

Example starting point:

-   Free: \~10%
-   Pro: \~5%
-   Premium/future tiers: potentially lower

These are initial hypotheses and should be validated with actual
economics and user behavior.

Payment-processing costs are separate from the platform commission.

### 3. Hiring / marketplace transactions

For paid artist engagements, the platform can charge a transparent
marketplace/service fee.

The exact structure will be validated during implementation.

------------------------------------------------------------------------

# 4. Product Boundary

Artist Collage is **not** initially:

-   A social network
-   A Spotify competitor
-   A follower/engagement platform
-   A content feed
-   A messaging-first community
-   An event platform

Avoid building:

-   Stories
-   Likes
-   Feeds
-   Complex social graphs
-   Unnecessary recommendation engines
-   Microservices
-   Multi-tenant architecture

The product should remain focused on professional discovery and
transactions.

------------------------------------------------------------------------

# 5. Web + Mobile Strategy

We will **not make the platform app-only**.

### Web = Discovery Layer

The public web will provide:

-   Landing page
-   Artist directory
-   Search and filters
-   Public artist profiles
-   Public track/store pages
-   Shareable artist URLs
-   SEO

Example:

`artistcollage.com/artist/guru-nadig`

A profile can be shared through:

-   Instagram
-   WhatsApp
-   YouTube
-   Email
-   Google search
-   Other websites

### Mobile App = Product Layer

React Native + Expo will power the main application.

The app will handle:

### Fans

-   Discovery
-   Artist profiles
-   Audio previews
-   Purchases
-   Downloads
-   Personal music library
-   Audio player
-   Notifications

### Artists

-   Dashboard
-   Profile management
-   Music uploads
-   Store management
-   Sales
-   Enquiries
-   Contracts
-   Subscription
-   Notifications
-   Analytics

The web and app use the same backend and artist database.

------------------------------------------------------------------------

# 6. Music Player & Offline Library

The audio player is a core feature, not an afterthought.

Before purchase:

-   Stream a preview
-   Artist-controlled preview length

After purchase:

-   Full track access
-   MP3 download
-   WAV download
-   Add to personal library
-   Offline playback

The app should provide a simple personal music library with:

-   Recently added
-   Purchased tracks
-   Artwork
-   Artist information
-   Playback controls
-   Seek
-   Background playback
-   Headphone / lock-screen controls
-   Offline playback

Purchased files should not expose permanent public storage URLs.

Flow:

**Purchase verified → entitlement checked → temporary signed download
URL → local download → offline library**

------------------------------------------------------------------------

# 7. AI Layer

OpenAI API will power the AI functionality, beginning with contracts.

Potential Phase 1 AI functionality:

-   Generate a contract draft from structured inputs
-   Explain contract clauses
-   Answer questions about the generated contract
-   Identify missing information
-   Help users understand rights, payments and deliverables

AI output should remain editable and subject to human review.

AI is a supporting layer, not the product itself.

------------------------------------------------------------------------

# 8. Technical Architecture

## Frontend

### Public Web

-   Next.js
-   React
-   Tailwind CSS

### Mobile

-   React Native
-   Expo

------------------------------------------------------------------------

## Backend

### Django + Django REST Framework

Django is preferred over FastAPI for V1 because the product is heavily
business-logic and CRUD oriented:

-   Users
-   Artists
-   Profiles
-   Tracks
-   Products
-   Orders
-   Payments
-   Subscriptions
-   Contracts
-   Reviews
-   Enquiries
-   Notifications
-   Administration

Django Admin will provide the initial internal operations and moderation
interface.

------------------------------------------------------------------------

## Database

### PostgreSQL

PostgreSQL is the primary source of truth.

No multi-tenancy is required for V1.

This is a multi-user platform, not a SaaS product where each customer
needs an isolated tenant.

------------------------------------------------------------------------

## Background Processing

### Redis + Celery

Used for asynchronous work such as:

-   Emails
-   Notifications
-   Payment processing tasks
-   PDF generation
-   Media processing
-   Other background jobs

------------------------------------------------------------------------

## Infrastructure

### Railway

Railway will host the core backend infrastructure:

-   Django API
-   PostgreSQL
-   Redis
-   Celery worker
-   Celery scheduler where required

Keep the infrastructure simple and centralized initially.

------------------------------------------------------------------------

## Object Storage

Audio, images and generated documents should not live on the application
server.

Preferred direction:

### Cloudflare R2

Use object storage for:

-   MP3
-   WAV
-   Album artwork
-   Artist images
-   Portfolio assets
-   Contract PDFs
-   Other digital assets

R2 is attractive for a media-heavy product because of its S3-compatible
API and lack of traditional egress fees.

A CDN can be introduced later if traffic requires it.

------------------------------------------------------------------------

# 9. Third-Party Services

Initial external services:

### Payments

**Razorpay + Razorpay Route**

### AI

**OpenAI API**

### OTP

**MSG91 or equivalent Indian OTP provider**

### Email

**Resend / Amazon SES / equivalent**

### Monitoring

**Sentry**

### Product analytics

**PostHog**

### Storage

**Cloudflare R2**

Keep third-party services replaceable behind clean application
abstractions wherever practical.

------------------------------------------------------------------------

# 10. Security & Access

Important principles:

-   Private audio files should not have permanent public URLs
-   Paid downloads require verified purchase entitlement
-   Signed temporary download URLs
-   Payment verification through webhooks
-   Server-side pricing and transaction validation
-   Rate limiting
-   Secure authentication
-   Role-based access for artist/admin functionality
-   File-type and upload validation
-   Basic abuse/reporting system

------------------------------------------------------------------------

# 11. Admin & Moderation

Django Admin should be used as the first internal operations console.

Admin needs visibility/control over:

-   Artists
-   Artist verification
-   Tracks
-   Uploaded files
-   Products
-   Orders
-   Payments
-   Refunds
-   Subscriptions
-   Contracts
-   Enquiries
-   Reviews
-   Reports
-   Featured artists
-   Categories / genres
-   Suspended users

The goal is not to build a beautiful internal dashboard in Phase 1.

**Powerful and functional beats pretty.**

------------------------------------------------------------------------

# 12. Phase 1 --- Build This

Phase 1 should be deliberately limited.

## Public Web

-   Landing page
-   Artist directory
-   Search/filter
-   Public artist profiles
-   Public track pages
-   Artist/store URLs
-   Basic SEO
-   Login/signup entry points

## Mobile App

### Authentication

-   Phone/email authentication
-   OTP

### Artist

-   Create/edit profile
-   Portfolio
-   Availability
-   Upload track
-   Set track price
-   Manage storefront
-   View sales
-   Basic dashboard
-   Subscription management

### Fan

-   Discover artists
-   View artist profiles
-   Preview tracks
-   Purchase tracks
-   Download purchased files
-   Music library
-   Audio player
-   Offline playback
-   Notifications

### Contracts

-   Contract creation wizard
-   Structured contract data
-   AI-assisted contract drafting
-   Human editing/review
-   PDF generation
-   Contract storage
-   Basic signing/acceptance workflow

### Payments

-   Razorpay checkout
-   Payment verification
-   Orders
-   Artist earnings
-   Platform fee calculation
-   Settlement/transfer integration

### Admin

-   Artist management
-   Track moderation
-   User management
-   Orders/payments
-   Reports
-   Basic verification

------------------------------------------------------------------------

# 13. Phase 1 --- Explicitly NOT Building

Do not let scope creep into:

-   Social feed
-   Followers
-   Likes
-   Stories
-   Full messaging system
-   Events
-   Advanced recommendations
-   AI artist matching
-   Advanced search engines
-   Complex rights management
-   Large-scale streaming infrastructure
-   Microservices
-   Multi-tenancy
-   Kubernetes
-   Native iOS/Android separate codebases
-   Elaborate admin UI

These can be evaluated after real usage.

------------------------------------------------------------------------

# 14. Launch Strategy --- Build in Public

The build itself becomes part of the marketing.

The development journey will be documented as a vlog/content series.

The story:

> **Building Artist Collage from scratch for independent artists.**

Content can cover:

-   Why Artist Collage exists
-   Designing the product
-   Building the directory
-   Building artist profiles
-   Building the music store
-   Implementing payments
-   Building the audio library
-   Building AI-assisted contracts
-   Inviting real artists
-   First artist onboarding
-   First track upload
-   First music sale
-   First collaboration
-   First contract
-   Product failures and improvements

The artists themselves become part of the story.

The build is not just development.

**The build is the marketing campaign.**

------------------------------------------------------------------------

# 15. Initial Success Metrics

Do not optimize for vanity metrics first.

Phase 1 validation should focus on:

-   Number of real artists onboarded
-   Completed artist profiles
-   Tracks uploaded
-   Tracks purchased
-   Total artist earnings
-   Number of hiring/collaboration enquiries
-   Contracts created
-   Contracts completed
-   Paid artist subscriptions
-   Repeat buyers
-   Repeat artist usage

The first major goal is not millions of users.

It is:

> **Can 100 real artists use this and find genuine value in it?**

Then:

> **Can real money move through the platform?**

------------------------------------------------------------------------

# 16. Product Philosophy

Artist Collage should feel:

-   Professional
-   Premium
-   Minimal
-   Artist-first
-   Trustworthy
-   Easy
-   Fast
-   Modern without being gimmicky

The product should hide complexity.

An artist should not need to understand:

-   Payment routing
-   Object storage
-   Signed URLs
-   Contract generation
-   Settlement systems
-   Background jobs
-   APIs

They should simply experience:

> **Create → Publish → Get discovered → Get paid.**

------------------------------------------------------------------------

# 17. The Core Loop

### Discovery

Artist creates a professional identity.

↓

### Connection

Someone discovers them for music, hiring or collaboration.

↓

### Transaction

A purchase, collaboration or hiring opportunity happens.

↓

### Contract

Where necessary, the agreement becomes structured and documented.

↓

### Payment

Money moves through the platform.

↓

### Reputation

Completed work builds trust and professional history.

↓

### More Discovery

The artist becomes easier to discover and trust.

------------------------------------------------------------------------

# 18. The V1 Principle

Artist Collage does not need to become everything for artists.

It needs to become **useful enough that artists keep their professional
identity here.**

The first version is therefore:

> **Artist Directory + Artist Store + Contracts + Payments +
> Professional Artist Tools**

Build the foundation.

Get real artists onto it.

Move real money.

Listen.

Then expand.

------------------------------------------------------------------------

# LOCK AND LOAD

**Artist Collage V1**

**Discover. Collaborate. Hire. Contract. Sell. Get paid.**

Build it. Document it. Put it in front of artists.

**The product and the build story become the marketing.**
