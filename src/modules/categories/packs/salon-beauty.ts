import { CategoryPack } from "../types";

export const salonBeautyPack: CategoryPack = {
  id: "salon-beauty",
  title: "Salon & Beauty",
  tagline: "Sophisticated glamor, bespoke aesthetics, and hair artistry",
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
  experienceAdaptations: {
    STANDARD: {
      level: "STANDARD",
      title: "Clean Studio & Appointment Scheduling",
      tagline: "Transparent service pricing menus, lookbook cards, and direct booking",
      characteristics: [
        "Clean service menu tables with duration and starting rates",
        "Direct stylist booking calendar with instant confirmation",
        "Clear address, parking, and salon etiquette information",
      ],
      recommendedComponents: ["ServicePriceList", "StylistBookingWidget", "LookbookGrid", "ReviewsCarousel"],
    },
    CINEMATIC: {
      level: "CINEMATIC",
      title: "Runway Artistry & Transformation",
      tagline: "Editorial slow-motion hair flips, soft studio lighting, and dramatic before/after reveals",
      characteristics: [
        "Full-bleed slow-motion video showing Parisian balayage application and bouncy silk blowouts",
        "Interactive Before/After split-screen slider revealing dull frizzy hair transforming into radiant dimensional color",
        "Pinned seasonal collection with smooth editorial zoom transitions",
      ],
      recommendedComponents: ["EditorialVideoHero", "HairTransformationSlider", "PinnedLookbookReveal", "StylistDialogueVideo"],
    },
    IMMERSIVE_3D: {
      level: "IMMERSIVE_3D",
      title: "Interactive 3D Beauty & Cosmetic Studio",
      tagline: "Interactive 3D beauty product inspection and 360-degree hair mannequin styling",
      characteristics: [
        "3D interactive luxury cosmetic serum bottle with realistic glass dispersion and liquid shaders",
        "360-degree interactive hair volume model demonstrating dimensional balayage depth under moving studio lighting",
      ],
      recommendedComponents: ["CosmeticProduct3D", "Hairstyle360Viewer", "SalonAestheticWalkthrough"],
    },
  },
  visualAssetRequirements: {
    imageStandard: "High-fashion editorial beauty photography with soft beauty-dish lighting and natural skin texture (min 3840x2160).",
    videoFormat: "4K 60fps / 120fps hair movement cinematography, water rinse slow-motion, and product lathering.",
    frameSequenceSpecs: "120-frame sequence of 360-degree hair rotation showing seamless dimensional color blending.",
    threeDModelSpecs: "GLTF/GLB models of luxury cosmetic dispensers with physical glass/metallic materials under 8MB.",
  },
  animationRecommendations: [
    "Smooth editorial crossfades between lookbook gallery images.",
    "Gentle floating parallax on luxury beauty product highlights.",
  ],
  seoAndAccessibility: [
    "BeautySalon and HealthAndBeautyBusiness Schema.org markup.",
    "Accessible color contrast on soft blush and nude backgrounds.",
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
      cinematicHook: "Full-bleed slow-motion video of hair catching soft studio light and flowing with luxurious silk movement.",
      threeDHook: "Interactive 3D serum bottle rotating smoothly on mouse move with glass refraction.",
      previewSnippet: {
        headline: "Effortless Elegance, Tailored Exclusively for You",
        subheadline: "Master stylists and certified aesthetic artisans delivering transformative hair and skin artistry.",
        actionLabel: "Book Your Appointment",
        beforeLabel: "Dry, Uneven Brass Tones",
        afterLabel: "Dimensional French Balayage Glow",
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
      cinematicHook: "Interactive Before/After slider demonstrating dramatic client hair transformation.",
      previewSnippet: {
        headline: "The Lookbook Gallery",
        subheadline: "Inspiration for your next dimensional color, signature blowout, or sleek aesthetic.",
        beforeLabel: "Over-processed Damaged Ends",
        afterLabel: "Silky Glass-Hair Botanical Gloss",
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
