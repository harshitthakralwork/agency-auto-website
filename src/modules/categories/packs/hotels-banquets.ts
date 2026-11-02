import { CategoryPack } from "../types";

export const hotelsBanquetsPack: CategoryPack = {
  id: "hotels-banquets",
  title: "Hotels & Banquets",
  tagline: "Atmospheric, opulent hospitality and celebration venues",
  description:
    "Tailored for boutique hotels, luxury resorts, banquet halls, and convention centers with room availability, wedding packages, and sensory visual storytelling.",
  iconName: "Hotel",
  badgeColor: "amber",
  suggestedPreset: "luxury",
  keyFeatures: [
    "Date & Room Availability Engine",
    "Suites & Accommodation Virtual Tours",
    "Banquet & Wedding Hall Capacity Specs",
    "Culinary & In-House Catering Menus",
    "Event RFP & Inquiry Generator",
    "Concierge & Local Destination Guides",
  ],
  recommendedPages: [
    { id: "home", name: "Home", slug: "/", description: "Immersive hero showcasing rooms, events, and atmosphere", isPrimary: true },
    { id: "rooms", name: "Rooms & Suites", slug: "/rooms-suites", description: "Detailed accommodations with amenities and nightly rates", isPrimary: true },
    { id: "banquets", name: "Banquets & Weddings", slug: "/weddings-banquets", description: "Grand ballrooms, seating layouts, and wedding packages", isPrimary: true },
    { id: "dining", name: "Dining & Lounges", slug: "/dining", description: "Michelin-inspired restaurants and rooftop cocktail lounges", isPrimary: false },
    { id: "gallery", name: "Visual Gallery", slug: "/gallery", description: "High-resolution architectural photography and event moments", isPrimary: false },
    { id: "contact", name: "Reservations & Contact", slug: "/contact", description: "Direct booking assistance and corporate event planning", isPrimary: true },
  ],
  recommendedSections: [
    {
      id: "cinematic_hero",
      name: "Cinematic Hero & Room Search Bar",
      description: "Full-bleed visual video header with check-in/out and guest selector.",
      defaultEnabled: true,
      order: 1,
      previewSnippet: {
        headline: "Where Timeless Grandeur Meets Modern Indulgence",
        subheadline: "Experience bespoke hospitality, private suites, and world-class culinary art.",
        actionLabel: "Reserve Your Stay",
      },
    },
    {
      id: "suites_showcase",
      name: "Suites & Accommodations Collection",
      description: "Card slider showcasing presidential suites, balcony views, and perks.",
      defaultEnabled: true,
      order: 2,
      previewSnippet: {
        headline: "Signature Accommodations",
        subheadline: "Each suite is meticulously appointed with Italian linens and panoramic city views.",
        actionLabel: "Explore All Suites",
      },
    },
    {
      id: "banquet_spaces",
      name: "Grand Ballroom & Event Spaces",
      description: "Square footage, guest capacity, and lighting setups for weddings and galas.",
      defaultEnabled: true,
      order: 3,
      previewSnippet: {
        headline: "Majestic Banquets & Celebrations",
        subheadline: "Accommodating up to 800 guests across 15,000 sq. ft. of crystal-chandeliered ballrooms.",
        actionLabel: "Download Wedding Brochure",
      },
    },
    {
      id: "culinary_highlights",
      name: "Fine Dining & Sommelier Cellar",
      description: "Chef introduction, seasonal farm-to-table tasting menus, and lounge hours.",
      defaultEnabled: true,
      order: 4,
      previewSnippet: {
        headline: "Culinary Alchemy & Rooftop Views",
        subheadline: "Savor inventive regional delicacies paired with reserve vintages from our sommelier.",
      },
    },
    {
      id: "amenities_spa",
      name: "Wellness Spa & Infinity Pool",
      description: "Thermal bathhouse, vitality pools, and private cabana reservations.",
      defaultEnabled: false,
      order: 5,
      previewSnippet: {
        headline: "Serenity Sanctuary & Spa",
        subheadline: "Rejuvenate with botanical hydrotherapy and tailored holistic treatments.",
      },
    },
  ],
};
