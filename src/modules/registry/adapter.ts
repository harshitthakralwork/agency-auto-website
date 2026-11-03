import { ComponentDefinition, AdaptationContext, AdaptedComponentData } from "./types";
import { getCategoryPack } from "../categories/registry";
import { DESIGN_PRESETS } from "../design/presets";

// Category dictionaries for semantic copy and badge adaptation
const CATEGORY_ADAPTATIONS: Record<
  string,
  {
    badge: string;
    heroHeadline: string;
    heroSubheadline: string;
    primaryCta: string;
    secondaryCta: string;
    aboutEyebrow: string;
    aboutTitle: string;
    aboutPillars: string[];
    servicesTitle: string;
    services: Array<{ title: string; description: string; tag: string }>;
    stats: Array<{ number: string; label: string }>;
    contactTitle: string;
    contactSubtitle: string;
    contactCta: string;
    beforeLabel: string;
    afterLabel: string;
    beforeAfterTitle: string;
    faqQuestions: Array<{ question: string; answer: string }>;
  }
> = {
  healthcare: {
    badge: "Board-Certified Medical Practice",
    heroHeadline: "Clinical Excellence Grounded in Compassionate Patient Care",
    heroSubheadline: "Providing world-class diagnostics, evidence-based therapies, and individualized care in a sterile, modern environment.",
    primaryCta: "Book a Consultation",
    secondaryCta: "Explore Clinical Services",
    aboutEyebrow: "Our Clinical Ethos",
    aboutTitle: "Devoted to Uncompromising Healthcare Standards",
    aboutPillars: [
      "Board-certified physician leadership with over 15 years in practice.",
      "Strict HIPAA compliance and sterile medical-grade environments.",
    ],
    servicesTitle: "Specialized Clinical Departments & Care Protocols",
    services: [
      { title: "Diagnostic Screening & Evaluation", description: "Comprehensive biometric imaging and personalized patient assessments.", tag: "Diagnostic" },
      { title: "Specialized Treatment Protocols", description: "Targeted therapy formulated to accelerate healing and minimize discomfort.", tag: "Clinical" },
      { title: "Long-Term Preventative Care", description: "Proactive wellness monitoring and routine check-ins to preserve vitality.", tag: "Wellness" },
    ],
    stats: [
      { number: "15,000+", label: "Patients Treated" },
      { number: "99.4%", label: "Clinical Success Rate" },
      { number: "25+", label: "Specialists on Staff" },
      { number: "100%", label: "HIPAA Compliant" },
    ],
    contactTitle: "Schedule Your Confidential Medical Consultation",
    contactSubtitle: "Our patient care coordinators reply within 2 hours during clinic hours.",
    contactCta: "Request Confidential Appointment",
    beforeLabel: "Pre-Treatment Diagnostic",
    afterLabel: "8 Weeks Post-Protocol",
    beforeAfterTitle: "Verified Clinical Rehabilitation Outcomes",
    faqQuestions: [
      { question: "What should I bring to my first medical evaluation?", answer: "Please bring a valid photo ID, active insurance cards, and any recent lab or imaging reports." },
      { question: "Do you accept major insurance networks?", answer: "Yes, we are in-network with most major health plans and provide itemized documentation for out-of-network claims." },
    ],
  },
  "hotels-banquets": {
    badge: "5-Star Luxury Hospitality & Venues",
    heroHeadline: "Unrivaled Elegance, Grandeur & Bespoke Hospitality",
    heroSubheadline: "An iconic destination designed for exquisite weddings, gala celebrations, and restorative luxury stays.",
    primaryCta: "Reserve Your Experience",
    secondaryCta: "Inquire for Private Events",
    aboutEyebrow: "The Heritage of Grandeur",
    aboutTitle: "Where Timeless Luxury Meets Impeccable Service",
    aboutPillars: [
      "Award-winning architectural halls and opulent banquet ballrooms.",
      "Dedicated concierge and master event coordinators for flawless execution.",
    ],
    servicesTitle: "Exceptional Venues & Bespoke Hospitality Services",
    services: [
      { title: "Grand Ballroom & Gala Banquets", description: "Accommodating up to 800 guests with custom crystal chandeliers and staging.", tag: "Venues" },
      { title: "Executive Luxury Suites", description: "Expansive suites with panoramic skyline views and private butler service.", tag: "Suites" },
      { title: "Artisanal Catering & Sommelier Pairings", description: "Tailored fine dining menus prepared by internationally acclaimed executive chefs.", tag: "Gastronomy" },
    ],
    stats: [
      { number: "500+", label: "Gala Celebrations Hosted" },
      { number: "5-Star", label: "Luxury Diamond Award" },
      { number: "800", label: "Guest Ballroom Capacity" },
      { number: "24/7", label: "Dedicated Concierge" },
    ],
    contactTitle: "Plan Your Private Gala or Reserve a Suite",
    contactSubtitle: "Our event directors will arrange a private venue walkthrough and tasting consultation.",
    contactCta: "Inquire with Concierge",
    beforeLabel: "Daytime Setup",
    afterLabel: "Evening Gala Lighting",
    beforeAfterTitle: "Ballroom Staging & Lighting Transformation",
    faqQuestions: [
      { question: "What is your event capacity for wedding banquets?", answer: "Our Grand Ballroom hosts up to 800 guests for seated dinners and 1,200 for cocktail receptions." },
      { question: "Are catering and beverage services included?", answer: "Yes, our executive culinary team crafts fully customized multi-course menus and sommelier pairings." },
    ],
  },
  "food-restaurants": {
    badge: "Artisanal Craft & Seasonal Dining",
    heroHeadline: "A Symphony of Flavors Crafted with Artistry & Fire",
    heroSubheadline: "Locally sourced seasonal ingredients, meticulous wood-fired techniques, and unforgettable gastronomic hospitality.",
    primaryCta: "Reserve a Table",
    secondaryCta: "View Tasting Menu",
    aboutEyebrow: "Culinary Heritage",
    aboutTitle: "Passionate Craftsmanship on Every Plate",
    aboutPillars: [
      "100% farm-to-table organic produce sourced directly from regional growers.",
      "Chef-driven seasonal menus celebrating heritage culinary traditions.",
    ],
    servicesTitle: "Dining Experiences & Curated Tasting Menus",
    services: [
      { title: "Chef's 7-Course Tasting Menu", description: "An experiential culinary journey paired with reserve vintage wines.", tag: "Signature" },
      { title: "Private Dining Room & Cellar", description: "An intimate dining sanctuary for private parties of up to 24 guests.", tag: "Private" },
      { title: "Artisanal Cocktails & Cellar Selection", description: "Hand-crafted botanicals, house infusions, and rare vintage spirits.", tag: "Libations" },
    ],
    stats: [
      { number: "10,000+", label: "Tasting Menus Served" },
      { number: "100%", label: "Farm-to-Table Sourced" },
      { number: "4.9★", label: "Guest Satisfaction" },
      { number: "18", label: "Seasonal Specialties" },
    ],
    contactTitle: "Reserve Your Table or Inquire for Private Dining",
    contactSubtitle: "Reservations open 30 days in advance. We accommodate special dietary preferences.",
    contactCta: "Confirm Reservation",
    beforeLabel: "Raw Farm Ingredients",
    afterLabel: "Finished Culinary Plating",
    beforeAfterTitle: "From Field to Fine Dining Presentation",
    faqQuestions: [
      { question: "Do you accommodate dietary restrictions and allergies?", answer: "Yes, with 24 hours advance notice our kitchen gladly prepares bespoke vegan, gluten-free, and allergy-safe menus." },
      { question: "What is the dress code for dinner service?", answer: "We recommend smart casual or formal attire to complement the relaxed yet refined dining ambiance." },
    ],
  },
  "fitness-gyms": {
    badge: "Elite Athletic Performance & Strength",
    heroHeadline: "Redefine Your Limits with High-Performance Coaching",
    heroSubheadline: "State-of-the-art strength zones, Olympic-grade conditioning, and tailored sports science protocols built for peak vitality.",
    primaryCta: "Claim 7-Day VIP Pass",
    secondaryCta: "Explore Training Programs",
    aboutEyebrow: "Our Training Philosophy",
    aboutTitle: "Engineered for Relentless Human Potential",
    aboutPillars: [
      "Certified master athletic coaches with Olympic and collegiate backgrounds.",
      "Comprehensive biomechanics and metabolic testing to tailor every workout.",
    ],
    servicesTitle: "Elite Training Programs & Athletic Amenities",
    services: [
      { title: "1-on-1 Performance Coaching", description: "Customized periodized training regimes designed for strength, speed, and aesthetics.", tag: "Personal" },
      { title: "High-Intensity Functional Conditioning", description: "Small-group high-energy athletic camps engineered for fat loss and endurance.", tag: "Group" },
      { title: "Sports Recovery & Cryotherapy", description: "Cold plunges, infrared saunas, and targeted percussion recovery therapy.", tag: "Recovery" },
    ],
    stats: [
      { number: "2,500+", label: "Active Athletic Members" },
      { number: "98.7%", label: "Goal Achievement Rate" },
      { number: "15,000 sq ft", label: "High-Performance Facility" },
      { number: "30+", label: "Certified Strength Coaches" },
    ],
    contactTitle: "Start Your Transformation Today",
    contactSubtitle: "Schedule your complimentary fitness assessment and facility tour.",
    contactCta: "Claim Your VIP Pass",
    beforeLabel: "Day 1 Baseline Assessment",
    afterLabel: "90-Day Athletic Peak",
    beforeAfterTitle: "Documented Athletic Body Recomposition",
    faqQuestions: [
      { question: "What is included with the 7-day VIP trial pass?", answer: "You receive full facility access, all group classes, a 1-on-1 biometric consultation, and recovery lounge access." },
      { question: "Are your personal trainers certified?", answer: "All our coaches hold NSCA-CSCS or NASM certifications and undergo rigorous continuing education." },
    ],
  },
  "salon-beauty": {
    badge: "Couture Styling & Luxury Aesthetics",
    heroHeadline: "Artistry, Elegance & Radiant Self-Expression",
    heroSubheadline: "Bespoke hair design, master balayage, luminous skin therapies, and couture beauty in a serene sanctuary.",
    primaryCta: "Book Your Transformation",
    secondaryCta: "Explore Beauty Services",
    aboutEyebrow: "The Art of Beauty",
    aboutTitle: "Where Masterful Artistry Meets Pure Luxury",
    aboutPillars: [
      "Master stylists trained at international beauty academies in Paris and London.",
      "Exclusively using clean, organic, and cruelty-free professional formulations.",
    ],
    servicesTitle: "Signature Beauty & Aesthetic Treatments",
    services: [
      { title: "Master Hair Styling & Balayage", description: "Precision cutting and multidimensional hand-painted color tailored to your features.", tag: "Hair" },
      { title: "Luminous Hydra-Facial Therapy", description: "Deep restorative hydration and lymphatic drainage for an unmistakable radiant glow.", tag: "Skin" },
      { title: "Bridal & Editorial Glamour", description: "Bespoke bridal styling packages including previews and on-location service.", tag: "Special" },
    ],
    stats: [
      { number: "8,500+", label: "Clients Transformed" },
      { number: "100%", label: "Cruelty-Free Products" },
      { number: "4.9★", label: "Overall Client Rating" },
      { number: "12", label: "Master Stylists" },
    ],
    contactTitle: "Reserve Your Salon & Spa Appointment",
    contactSubtitle: "Indulge in a personalized consultation and complimentary beverage service.",
    contactCta: "Book Your Appointment",
    beforeLabel: "Initial Arrival",
    afterLabel: "Finished Couture Style",
    beforeAfterTitle: "Hair & Skin Aesthetic Transformation",
    faqQuestions: [
      { question: "How long does a full balayage and styling appointment take?", answer: "A comprehensive color transformation typically takes 2.5 to 3.5 hours to ensure gentle, flawless application." },
      { question: "Can I bring inspiration photos to my consultation?", answer: "Absolutely! We encourage you to share your vision so our master stylists can customize it to your features." },
    ],
  },
  "schools-coaching": {
    badge: "Academic Excellence & Future Leadership",
    heroHeadline: "Empowering Inquiring Minds to Lead Tomorrow's World",
    heroSubheadline: "Rigorous academic curricula, world-class faculty mentors, and holistic character development from early learning to university prep.",
    primaryCta: "Schedule an Admissions Tour",
    secondaryCta: "Download Curriculum Prospectus",
    aboutEyebrow: "Our Educational Vision",
    aboutTitle: "Cultivating Intellect, Character & Resilience",
    aboutPillars: [
      "State-accredited curriculum with a 99% university matriculation rate.",
      "Dedicated 8:1 student-to-faculty ratio fostering individual curiosity and leadership.",
    ],
    servicesTitle: "Academic Programs & Student Enrichment",
    services: [
      { title: "STEM & Robotics Innovation Academy", description: "Hands-on engineering, coding, and laboratory science in modern maker spaces.", tag: "Academics" },
      { title: "University Admissions & Test Prep", description: "Tailored SAT/ACT prep and holistic college portfolio coaching by admissions veterans.", tag: "Coaching" },
      { title: "Visual Arts, Music & Speech", description: "Award-winning fine arts studios, orchestral ensembles, and competitive debate teams.", tag: "Arts" },
    ],
    stats: [
      { number: "99%", label: "College Acceptance" },
      { number: "8:1", label: "Student-to-Faculty Ratio" },
      { number: "Top 1%", label: "National Academic Ranking" },
      { number: "45+", label: "Enrichment Clubs" },
    ],
    contactTitle: "Discover Your Student's Potential",
    contactSubtitle: "Schedule a private campus tour and meet our academic leadership team.",
    contactCta: "Request Admissions Tour",
    beforeLabel: "Diagnostic Baseline",
    afterLabel: "Academic Mastery",
    beforeAfterTitle: "Demonstrated Student Growth & Percentile Gains",
    faqQuestions: [
      { question: "What is your application deadline for the upcoming academic year?", answer: "Priority admissions close on January 15th, followed by rolling admissions subject to classroom capacity." },
      { question: "Do you offer merit scholarships or tuition assistance?", answer: "Yes, we offer need-based financial aid and merit scholarships for qualified applicants." },
    ],
  },
};

export class ComponentAdapter {
  /**
   * Adapts a component's props and visual tokens based on Category, Design Preset, and Experience Level.
   */
  public static adaptComponent(
    definition: ComponentDefinition,
    context: AdaptationContext,
    variantId?: string
  ): AdaptedComponentData {
    const categoryKey = context.category.toLowerCase().replace(/_/g, "-");
    const catAdapt = CATEGORY_ADAPTATIONS[categoryKey] || CATEGORY_ADAPTATIONS["healthcare"];
    
    // Choose active variant
    const selectedVariant =
      definition.variants.find((v) => v.id === variantId) || definition.variants[0];

    // Clone default props
    const adaptedProps: Record<string, unknown> = { ...definition.defaultProps };

    // Apply category copy adaptation based on sectionType and family
    switch (definition.family) {
      case "HERO":
        if ("headline" in adaptedProps) adaptedProps.headline = catAdapt.heroHeadline;
        if ("subheadline" in adaptedProps) adaptedProps.subheadline = catAdapt.heroSubheadline;
        if ("badgeText" in adaptedProps) adaptedProps.badgeText = catAdapt.badge;
        if ("primaryCtaText" in adaptedProps) adaptedProps.primaryCtaText = catAdapt.primaryCta;
        if ("secondaryCtaText" in adaptedProps) adaptedProps.secondaryCtaText = catAdapt.secondaryCta;
        break;

      case "BUSINESS":
        if (definition.sectionType === "about") {
          if ("eyebrow" in adaptedProps) adaptedProps.eyebrow = catAdapt.aboutEyebrow;
          if ("title" in adaptedProps) adaptedProps.title = catAdapt.aboutTitle;
          if ("storyParagraphs" in adaptedProps) adaptedProps.storyParagraphs = catAdapt.aboutPillars;
        } else if (definition.sectionType === "services") {
          if ("title" in adaptedProps) adaptedProps.title = catAdapt.servicesTitle;
          if ("servicesList" in adaptedProps) {
            adaptedProps.servicesList = catAdapt.services.map((s, idx) => ({
              id: `service-${idx + 1}`,
              title: s.title,
              description: s.description,
              tag: s.tag,
              cta: "Learn More",
            }));
          }
        } else if (definition.sectionType === "stats") {
          if ("stats" in adaptedProps) adaptedProps.stats = catAdapt.stats;
        }
        break;

      case "CONVERSION":
        if ("title" in adaptedProps) adaptedProps.title = catAdapt.contactTitle;
        if ("subtitle" in adaptedProps) adaptedProps.subtitle = catAdapt.contactSubtitle;
        if ("submitButtonText" in adaptedProps) adaptedProps.submitButtonText = catAdapt.contactCta;
        if ("actionLabel" in adaptedProps) adaptedProps.actionLabel = catAdapt.contactCta;
        break;

      case "MEDIA":
        if (definition.sectionType === "before-after") {
          if ("title" in adaptedProps) adaptedProps.title = catAdapt.beforeAfterTitle;
          if ("beforeLabel" in adaptedProps) adaptedProps.beforeLabel = catAdapt.beforeLabel;
          if ("afterLabel" in adaptedProps) adaptedProps.afterLabel = catAdapt.afterLabel;
        }
        break;

      case "CONTENT":
        if (definition.sectionType === "faq") {
          if ("faqs" in adaptedProps) {
            adaptedProps.faqs = catAdapt.faqQuestions.map((q, idx) => ({
              id: `faq-${idx + 1}`,
              question: q.question,
              answer: q.answer,
            }));
          }
        }
        break;

      default:
        break;
    }

    // Resolve design preset tokens
    const presetId = (context.designPreset || "cinematic") as Exclude<typeof context.designPreset, "custom">;
    const preset = DESIGN_PRESETS[presetId as keyof typeof DESIGN_PRESETS] || DESIGN_PRESETS.cinematic;

    const resolvedColors = {
      primary: context.colors?.primary || preset.colors.primary,
      secondary: context.colors?.secondary || preset.colors.secondary,
      accent: context.colors?.accent || preset.colors.accent,
      background: context.colors?.background || preset.colors.background,
      surface: context.colors?.surface || preset.colors.surface,
      text: context.colors?.text || preset.colors.text,
      mutedText: context.colors?.mutedText || preset.colors.mutedText,
    };

    const resolvedTypography = {
      headingFont: context.typography?.headingFont || preset.typography.headingFont,
      bodyFont: context.typography?.bodyFont || preset.typography.bodyFont,
      baseFontSize: context.typography?.baseFontSize || preset.typography.baseFontSize,
    };

    const resolvedLayout = {
      borderRadius: context.layout?.borderRadius || preset.layout.borderRadius,
      containerWidth: context.layout?.containerWidth || preset.layout.containerWidth,
    };

    return {
      componentId: definition.id,
      variantId: selectedVariant.id,
      props: adaptedProps,
      tokenStyles: {
        fontHeading: resolvedTypography.headingFont,
        fontBody: resolvedTypography.bodyFont,
        colorPrimary: resolvedColors.primary,
        colorSecondary: resolvedColors.secondary,
        colorAccent: resolvedColors.accent,
        colorBackground: resolvedColors.background,
        colorSurface: resolvedColors.surface,
        colorText: resolvedColors.text,
        colorMutedText: resolvedColors.mutedText,
        borderRadius: resolvedLayout.borderRadius,
      },
      experienceLevel: context.experienceLevel,
      category: categoryKey,
      tags: definition.tags,
    };
  }

  /**
   * Validates whether a component supports the requested experience level.
   */
  public static isSupported(definition: ComponentDefinition, level: string): boolean {
    return definition.supportedExperienceLevels.includes(level as any);
  }
}
