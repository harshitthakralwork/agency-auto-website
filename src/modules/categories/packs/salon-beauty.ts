import { CategoryPack } from "../types";

export const salonBeautyPack: CategoryPack = {
  id: "salon-beauty",
  title: "Salon & Beauty",
  tagline: "Sophisticated glamor, bespoke aesthetics, and effortless self-care",
  description:
    "Crafted for upscale hair salons, aesthetic medical spas, nail lounges, and brow studios highlighting artistic lookbooks, stylist talent, and appointment booking.",
  iconName: "Sparkles",
  badgeColor: "pink",
  suggestedPreset: "minimal",
  keyFeatures: [
    "Interactive Service Treatment Menu with Transparent Pricing",
    "Real-time Stylist & Practitioner Booking",
    "Editorial Lookbook & Portfolio Gallery",
    "Client Hair/Skin Transformation Showcases",
    "Luxury Product Boutique & Aftercare Guides",
    "VIP Membership & Package Perks",
  ],
  recommendedPages: [
    { id: "home", name: "Home", slug: "/", description: "Editorial visual aesthetic, stylist team, and booking shortcuts", isPrimary: true },
    { id: "services", name: "Services & Treatments", slug: "/services", description: "Coloring, cuts, lash extensions, facials, and wellness rituals", isPrimary: true },
    { id: "lookbook", name: "Lookbook & Gallery", slug: "/lookbook", description: "Curated seasonal hairstyles, balayage finishes, and makeup artistry", isPrimary: false },
    { id: "team", name: "Master Stylists", slug: "/stylists", description: "Senior colorists, aesthetic nurses, and specialist profiles", isPrimary: true },
    { id: "booking", name: "Book Appointment", slug: "/book", description: "Service selection, preferred stylist, and time reservation", isPrimary: true },
    { id: "contact", name: "Studio & Location", slug: "/contact", description: "Directions, valet parking, and cancellation policies", isPrimary: true },
  ],
  recommendedSections: [
    {
      id: "aesthetic_hero",
      name: "High-Fashion Aesthetic Hero",
      description: "Editorial photography with soft lighting, bold clean typography, and booking CTA.",
      defaultEnabled: true,
      order: 1,
      previewSnippet: {
        headline: "Effortless Elegance, Tailored Exclusively for You",
        subheadline: "Master stylists and certified aesthetic artisans delivering transformative hair and skin artistry.",
        actionLabel: "Book Your Appointment",
      },
    },
    {
      id: "service_menu",
      name: "Service Menu & Transparent Pricing",
      description: "Clean typography list with duration, starting price, and consultation notes.",
      defaultEnabled: true,
      order: 2,
      previewSnippet: {
        headline: "Curated Beauty & Hair Rituals",
        subheadline: "Balayage, precision cutting, hydrafacials, and restorative botanical treatments.",
        actionLabel: "View Complete Service Guide",
      },
    },
    {
      id: "lookbook_slider",
      name: "Editorial Lookbook Showcase",
      description: "Masonry or slider gallery of recent client transformations and salon editorial shoots.",
      defaultEnabled: true,
      order: 3,
      previewSnippet: {
        headline: "The Lookbook Gallery",
        subheadline: "Inspiration for your next dimensional color, signature blowout, or sleek aesthetic.",
      },
    },
    {
      id: "stylist_spotlight",
      name: "Master Stylists & Colorists",
      description: "Stylist portraits, specialty techniques (e.g. French balayage), and individual booking links.",
      defaultEnabled: true,
      order: 4,
      previewSnippet: {
        headline: "Meet Our Creative Directors",
        subheadline: "Passionate artists trained in Paris, London, and New York bringing runway refinement to your look.",
        actionLabel: "Meet the Team",
      },
    },
    {
      id: "client_reviews",
      name: "Client Love & Five-Star Reviews",
      description: "Glowing testimonials highlighting client pampering, salon ambiance, and outcomes.",
      defaultEnabled: false,
      order: 5,
      previewSnippet: {
        headline: "Beloved by Our Discerning Clients",
        subheadline: "Over 800 five-star reviews celebrating unmatched pampering and precision results.",
      },
    },
  ],
};
