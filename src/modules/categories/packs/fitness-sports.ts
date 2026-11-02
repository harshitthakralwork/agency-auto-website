import { CategoryPack } from "../types";

export const fitnessSportsPack: CategoryPack = {
  id: "fitness-sports",
  title: "Fitness & Sports",
  tagline: "High-voltage athletic energy, coaching, and body transformation",
  description:
    "Engineered for performance gyms, crossfit boxes, martial arts dojos, and sports training facilities focusing on membership acquisition and class schedules.",
  iconName: "Dumbbell",
  badgeColor: "orange",
  suggestedPreset: "cinematic",
  keyFeatures: [
    "Live Weekly Class Schedule & Timetable",
    "Membership Tier Comparison Matrix",
    "Trainer & Coach Profiles with Certifications",
    "Client Transformation Before/After Proof",
    "1-Day Free Guest Pass Claim Form",
    "Equipment & Facility Zone Showcase",
  ],
  recommendedPages: [
    { id: "home", name: "Home", slug: "/", description: "High-octane hero, trial offer, and class highlights", isPrimary: true },
    { id: "classes", name: "Classes & Programs", slug: "/classes", description: "HIIT, strength conditioning, combat sports, and recovery sessions", isPrimary: true },
    { id: "schedule", name: "Schedule & Timetable", slug: "/schedule", description: "Daily hourly calendar filtered by training intensity and instructor", isPrimary: true },
    { id: "trainers", name: "Coaches & Trainers", slug: "/trainers", description: "Olympic lifters, certified trainers, and personalized coaching bios", isPrimary: false },
    { id: "memberships", name: "Membership Tiers", slug: "/memberships", description: "Tier pricing, contract terms, guest passes, and perk breakdown", isPrimary: true },
    { id: "free-pass", name: "Claim Free Trial", slug: "/free-pass", description: "First-timer guest pass lead capture form", isPrimary: true },
  ],
  recommendedSections: [
    {
      id: "free_pass_cta",
      name: "High-Converting Free Trial Pass Banner",
      description: "Zero-commitment 1-day pass call-to-action for first-time visitors.",
      defaultEnabled: true,
      order: 1,
      previewSnippet: {
        headline: "Experience Peak Training — Your First Class Is On Us",
        subheadline: "Claim your complimentary day pass and access state-of-the-art turf, iron, and sauna.",
        actionLabel: "Claim Free Day Pass",
      },
    },
    {
      id: "high_energy_hero",
      name: "High-Energy Athletic Hero",
      description: "Aggressive, motivating headline and dynamic athlete training footage.",
      defaultEnabled: true,
      order: 2,
      previewSnippet: {
        headline: "Unleash Your Full Athletic Potential",
        subheadline: "Elite strength coaching, conditioning protocols, and recovery facilities built for serious progress.",
        actionLabel: "View All Programs",
      },
    },
    {
      id: "programs_breakdown",
      name: "Training Programs & Class Types",
      description: "Card grid with intensity gauges: Powerlifting, Olympic Strength, MetCon, Boxing.",
      defaultEnabled: true,
      order: 3,
      previewSnippet: {
        headline: "Engineered Training Disciplines",
        subheadline: "Scientifically structured programs engineered to build resilient power and endurance.",
      },
    },
    {
      id: "membership_matrix",
      name: "Membership Pricing & Tiers",
      description: "Three-tier pricing table: Basic Access, Elite Athlete, and Unlimited Private Coaching.",
      defaultEnabled: true,
      order: 4,
      previewSnippet: {
        headline: "Transparent Membership Tiers",
        subheadline: "No hidden registration fees. Flexible monthly memberships with complete facility access.",
        actionLabel: "Compare Tiers",
      },
    },
    {
      id: "transformation_stories",
      name: "Member Transformation & Testimonials",
      description: "Real member metric milestones, strength gains, and body transformations.",
      defaultEnabled: false,
      order: 5,
      previewSnippet: {
        headline: "Real Results. Relentless Dedication.",
        subheadline: "Over 1,200 active members redefining their limits every day.",
      },
    },
  ],
};
