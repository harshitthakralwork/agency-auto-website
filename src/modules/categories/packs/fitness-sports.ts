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
  experienceAdaptations: {
    STANDARD: {
      level: "STANDARD",
      title: "Direct Training Schedule & Pass",
      tagline: "Clear class calendar, transparent membership pricing, and 1-day pass form",
      characteristics: [
        "High-contrast weekly class schedule with filter by coach",
        "Transparent pricing cards with no hidden fees",
        "Direct guest trial pass lead capture form",
      ],
      recommendedComponents: ["ClassTimetableGrid", "PricingMatrixTable", "GuestPassForm", "TrainerCards"],
    },
    CINEMATIC: {
      level: "CINEMATIC",
      title: "High-Octane Athletic Adrenaline",
      tagline: "Aggressive motion, chalk dust particles, and visceral physique transformation storytelling",
      characteristics: [
        "High-energy 4K athletic workout video montage with pulse-pounding rhythm",
        "Interactive Physique Transformation slider revealing 16-week muscle and posture evolution",
        "Pinned training disciplines with dynamic background color shifts",
      ],
      recommendedComponents: ["AthleticVideoHero", "PhysiqueTransformationSlider", "PinnedDisciplineShowcase", "HeartRateMetricAnimation"],
    },
    IMMERSIVE_3D: {
      level: "IMMERSIVE_3D",
      title: "Interactive Biomechanics & Facility 3D",
      tagline: "Interactive 3D muscle anatomy targets and 3D performance turf exploration",
      characteristics: [
        "Interactive 3D anatomical human muscular model highlighting targeted muscle groups per program",
        "3D kettlebell / barbell product inspection with realistic metallic sheen",
        "Spatial 3D gym facility tour showing power racks, recovery sauna, and turf zones",
      ],
      recommendedComponents: ["MuscularAnatomyViewer3D", "GymSpatialMap3D", "EquipmentInspector3D"],
    },
  },
  visualAssetRequirements: {
    imageStandard: "High-contrast athletic photography in dramatic directional rim lighting (min 3840x2160).",
    videoFormat: "4K 60fps / 120fps high-octane workout footage with chalk dust, heavy lifts, and sprint drills.",
    frameSequenceSpecs: "180-frame smooth sequence of heavy barbell clean & jerk or deadlift lift execution.",
    threeDModelSpecs: "GLTF/GLB models of gym equipment and anatomical muscle models optimized under 10MB.",
  },
  animationRecommendations: [
    "Snappy spring physics on button hover and interactive cards.",
    "Dynamic metric counters for total pounds lifted, calories burned, and member milestones.",
  ],
  seoAndAccessibility: [
    "Gym and SportsActivityLocation Schema.org markup.",
    "Accessible high-contrast buttons for outdoor mobile visibility.",
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
      cinematicHook: "Full-bleed high-fps athletic workout video with flying chalk dust and pulse audio cues.",
      threeDHook: "Interactive 3D competition kettlebell rotating in space with real-time metallic reflections.",
      previewSnippet: {
        headline: "Unleash Your Full Athletic Potential",
        subheadline: "Elite strength coaching, conditioning protocols, and recovery facilities built for serious progress.",
        actionLabel: "View All Programs",
        beforeLabel: "Sedentary & Exhausted",
        afterLabel: "Peak Athletic Conditioning",
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
      defaultEnabled: true,
      order: 5,
      cinematicHook: "Interactive Before/After body composition transformation slider highlighting 12-week muscle gain and fat loss.",
      previewSnippet: {
        headline: "Real Results. Relentless Dedication.",
        subheadline: "Over 1,200 active members redefining their limits every day.",
        beforeLabel: "Day 1 Baseline (28% Body Fat)",
        afterLabel: "Week 16 Result (11% Body Fat, +150lb Deadlift)",
      },
    },
  ],
};
