import { CategoryPack } from "../types";

export const foodRestaurantsPack: CategoryPack = {
  id: "food-restaurants",
  title: "Food & Restaurants",
  tagline: "Mouth-watering, sensory gastronomy and effortless table reservations",
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
      previewSnippet: {
        headline: "Culinary Passion Crafted Over Open Woodfire",
        subheadline: "Modern regional gastronomy celebrating heirloom ingredients and spontaneous seasonal creation.",
        actionLabel: "Reserve a Table",
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
      previewSnippet: {
        headline: "Rooted in Soil, Flame, and Heritage",
        subheadline: "We forge close relationships with local regenerative farmers, artisanal fishermen, and foragers.",
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
