import { CategoryPack } from "../types";

export const foodRestaurantsPack: CategoryPack = {
  id: "food-restaurants",
  title: "Food & Restaurants",
  tagline: "Sensory gastronomy, open woodfire artistry, and table reservations",
  description:
    "Built for fine dining venues, bistros, artisan bakeries, and chef-driven restaurants focused on appetite appeal, interactive menus, and reservation conversions.",
  iconName: "Utensils",
  badgeColor: "rose",
  suggestedPreset: "cinematic",
  keyFeatures: [
    "Interactive Digital Menu with Dietary Badges",
    "Instant Table Reservation Form",
    "Chef's Philosophy & Ingredient Origin Story",
    "Daily Specials & Seasonal Tasting Menus",
    "Private Dining & Special Event Catering Inquiries",
    "Operating Hours, Valet Info & Live Location Map",
  ],
  experienceAdaptations: {
    STANDARD: {
      level: "STANDARD",
      title: "Clean Gastronomy & Reservations",
      tagline: "Clear categorized menus, open hours, and immediate table reservation booking",
      characteristics: [
        "Structured menu lists with dietary badges (GF, Vegan, Halal)",
        "Instant table booking widget with time/party selector",
        "Clear address, parking, and dress code information",
      ],
      recommendedComponents: ["MenuGrid", "ReservationBar", "OperatingHoursCard", "ChefBioSection"],
    },
    CINEMATIC: {
      level: "CINEMATIC",
      title: "Atmospheric Culinary Drama",
      tagline: "Slow-motion sizzle, charcoal flame cinematography, and sensory ingredient transformations",
      characteristics: [
        "Full-bleed ambient video hero featuring open woodfire, ember crackle, and precision knife work",
        "Raw-to-Finished culinary transformation slider (e.g. raw wagyu marbling to flame-seared crust)",
        "Pinned chef tasting menu with smooth wine pairing reveals as user scrolls",
      ],
      recommendedComponents: ["FlameVideoHero", "RawToSearTransformationSlider", "PinnedTastingMenuScroll", "SoundscapeToggle"],
    },
    IMMERSIVE_3D: {
      level: "IMMERSIVE_3D",
      title: "Interactive 3D Dish & Dining Space",
      tagline: "Photorealistic 3D signature dish inspection and table-level spatial ambiance",
      characteristics: [
        "3D photogrammetry-scanned signature dishes with 360-degree rotation and ingredient breakdowns",
        "Interactive 3D dining room view allowing guests to preview their table view and private booth lighting",
      ],
      recommendedComponents: ["SignatureDishViewer3D", "DiningRoomSpatialMap", "CocktailGlassConfigurator"],
    },
  },
  visualAssetRequirements: {
    imageStandard: "High-contrast culinary photography with shallow depth of field and warm tungsten tones (min 3840x2160).",
    videoFormat: "4K 120fps ultra-slow-motion footage of searing steaks, pouring sauces, and ember smoke.",
    frameSequenceSpecs: "150-frame sequence of searing a dry-aged ribeye on open charcoal with rising embers.",
    threeDModelSpecs: "High-detail photogrammetry scanned 3D food and drink assets under 12MB with high-res normal maps.",
  },
  animationRecommendations: [
    "Parallax smoke and ember particles drifting over header imagery.",
    "Smooth crossfade dish reveals as visitor navigates between appetizers and mains.",
  ],
  seoAndAccessibility: [
    "Restaurant Schema.org markup with menu items, currency, and opening hours.",
    "Detailed alt descriptions for all dishes highlighting flavors and allergens.",
  ],
  recommendedPages: [
    { id: "home", name: "Home", slug: "/", description: "Sensory food imagery, restaurant ambiance, and instant booking", isPrimary: true },
    { id: "menu", name: "Menu & Pairings", slug: "/menu", description: "Categorized seasonal dishes, wine pairings, and dietary guides", isPrimary: true },
    { id: "story", name: "Our Story & Kitchen", slug: "/our-story", description: "Executive Chef story, sustainable sourcing, and local purveyors", isPrimary: false },
    { id: "reservations", name: "Table Reservations", slug: "/reservations", description: "Date, party size, seating preferences, and special requests", isPrimary: true },
    { id: "catering", name: "Private Dining & Events", slug: "/private-dining", description: "Buyout options, custom event menus, and cocktail receptions", isPrimary: false },
    { id: "contact", name: "Hours & Directions", slug: "/contact", description: "Location, parking details, dress code, and contact information", isPrimary: true },
  ],
  recommendedSections: [
    {
      id: "sensory_hero",
      name: "Sensory Hero with Reserve CTA",
      description: "High-drama visual hero highlighting culinary artistry and warm ambiance.",
      defaultEnabled: true,
      order: 1,
      cinematicHook: "Full-bleed 4K video of embers rising over a glowing charcoal grill with precision plating.",
      threeDHook: "Interactive 3D cocktail glass or signature dish floating with subtle rotation on mouse move.",
      previewSnippet: {
        headline: "Culinary Passion Crafted Over Open Woodfire",
        subheadline: "Modern regional gastronomy celebrating heirloom ingredients and spontaneous seasonal creation.",
        actionLabel: "Reserve a Table",
        beforeLabel: "Heirloom Raw Coastal Produce",
        afterLabel: "Woodfire-Charred Degustation",
      },
    },
    {
      id: "interactive_menu",
      name: "Signature Menu Highlights",
      description: "Curated selection of appetizers, entrées, wood-fired specials, and desserts.",
      defaultEnabled: true,
      order: 2,
      previewSnippet: {
        headline: "From Our Kitchen to Your Table",
        subheadline: "Each dish is an honest tribute to sustainable coastal farming and bold charcoal flavor.",
        actionLabel: "View Full Seasonal Menu",
      },
    },
    {
      id: "reservation_bar",
      name: "Table Reservation Quick Bar",
      description: "Time, guests, and date picker widget for instant table confirmation.",
      defaultEnabled: true,
      order: 3,
      previewSnippet: {
        headline: "Join Us for an Unforgettable Evening",
        subheadline: "Dinner service nightly from 5:30 PM. Weekend brunch from 10:30 AM.",
        actionLabel: "Find Open Tables",
      },
    },
    {
      id: "chef_story",
      name: "Chef's Table & Sourcing Ethos",
      description: "Portrait and culinary philosophy of the head chef and local farm partnerships.",
      defaultEnabled: true,
      order: 4,
      cinematicHook: "Interactive Before/After slider demonstrating raw heirloom ingredients transforming into the plated masterpiece.",
      previewSnippet: {
        headline: "Rooted in Soil, Flame, and Heritage",
        subheadline: "We forge close relationships with local regenerative farmers, artisanal fishermen, and foragers.",
        beforeLabel: "Harvested Foraged Mushrooms",
        afterLabel: "Truffle Emulsion & Glaze",
      },
    },
    {
      id: "patron_reviews",
      name: "Critic Reviews & Customer Accolades",
      description: "Press mentions, food critic quotes, and Michelin / Zagat recognition.",
      defaultEnabled: false,
      order: 5,
      previewSnippet: {
        headline: "What the Critics Are Saying",
        subheadline: "“An exhilarating dining experience that pushes seasonal culinary boundaries.” — Metropolitan Food Review",
      },
    },
  ],
};
