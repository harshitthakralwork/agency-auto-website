import { ComponentDefinition } from "../types";

export const socialProofDefinitions: ComponentDefinition[] = [
  {
    id: "social-proof-testimonials-carousel",
    name: "Verified Testimonials Carousel",
    family: "SOCIAL_PROOF",
    sectionType: "testimonials",
    description: "Interactive slider of authentic verified client stories with ratings, client portraits, and verified badge.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC", "IMMERSIVE_3D"],
    requiredProps: ["title", "testimonials"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Section heading", required: true, defaultValue: "Loved by Patients and Discerning Patrons" },
      { name: "subtitle", type: "string", label: "Subtitle", description: "Section subtitle", required: false, defaultValue: "Read authentic feedback from individuals whose lives have been transformed." },
      { name: "testimonials", type: "array", label: "Testimonials", description: "Array of testimonial cards", required: true, defaultValue: [
        { id: "t1", quote: "The level of care and precision here is unmatched. From the very first consultation, I felt heard and confident.", author: "Sarah Jenkins", role: "Patient for 3 Years", rating: 5, avatar: "/images/placeholders/avatar-1.jpg", verified: true },
        { id: "t2", quote: "Remarkable professionalism. They exceeded every expectation and made the entire process seamless and reassuring.", author: "David Morales", role: "Executive Client", rating: 5, avatar: "/images/placeholders/avatar-2.jpg", verified: true },
        { id: "t3", quote: "A truly world-class standard. The environment is pristine and the team treats you like royalty.", author: "Claire Dupont", role: "Verified Member", rating: 5, avatar: "/images/placeholders/avatar-3.jpg", verified: true },
      ]},
    ],
    defaultProps: {
      title: "Loved by Patients and Discerning Patrons",
      subtitle: "Read authentic feedback from individuals whose lives have been transformed.",
      testimonials: [
        { id: "t1", quote: "The level of care and precision here is unmatched. From the very first consultation, I felt heard and confident.", author: "Sarah Jenkins", role: "Patient for 3 Years", rating: 5, avatar: "/images/placeholders/avatar-1.jpg", verified: true },
        { id: "t2", quote: "Remarkable professionalism. They exceeded every expectation and made the entire process seamless and reassuring.", author: "David Morales", role: "Executive Client", rating: 5, avatar: "/images/placeholders/avatar-2.jpg", verified: true },
        { id: "t3", quote: "A truly world-class standard. The environment is pristine and the team treats you like royalty.", author: "Claire Dupont", role: "Verified Member", rating: 5, avatar: "/images/placeholders/avatar-3.jpg", verified: true },
      ],
    },
    variants: [
      { id: "testimonials-slider", name: "Horizontal Carousel Slider", description: "Paginated card slider with dot navigation" },
      { id: "testimonials-single-spotlight", name: "Large Editorial Spotlight", description: "Oversized central quote with client portrait" },
    ],
    tags: ["social-proof", "testimonials", "carousel", "reviews", "ratings"],
  },
  {
    id: "social-proof-reviews-grid",
    name: "Multi-Source Reviews Masonry Grid",
    family: "SOCIAL_PROOF",
    sectionType: "reviews-grid",
    description: "Grid of verified reviews showcasing platform icons (Google, Trustpilot, Healthgrades) and star counts.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["title", "averageScore", "totalReviewCount", "reviews"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Heading", required: true, defaultValue: "Over 1,200 Five-Star Verified Reviews" },
      { name: "averageScore", type: "string", label: "Average Score", description: "Score (e.g. '4.9')", required: true, defaultValue: "4.9" },
      { name: "totalReviewCount", type: "string", label: "Total Reviews", description: "Count string", required: true, defaultValue: "1,248+" },
      { name: "reviews", type: "array", label: "Reviews", description: "List of review items", required: true, defaultValue: [
        { author: "Emily K.", platform: "Google Reviews", rating: 5, date: "2 days ago", comment: "Outstanding service and unmatched clinical expertise. Highly recommended!" },
        { author: "Robert T.", platform: "Trustpilot", rating: 5, date: "1 week ago", comment: "Transparent, respectful, and incredibly effective. Will never go anywhere else." },
        { author: "Anita P.", platform: "Verified Patient", rating: 5, date: "2 weeks ago", comment: "Compassionate team and pristine facility. Worth every single penny." },
      ]},
    ],
    defaultProps: {
      title: "Over 1,200 Five-Star Verified Reviews",
      averageScore: "4.9",
      totalReviewCount: "1,248+",
      reviews: [
        { author: "Emily K.", platform: "Google Reviews", rating: 5, date: "2 days ago", comment: "Outstanding service and unmatched clinical expertise. Highly recommended!" },
        { author: "Robert T.", platform: "Trustpilot", rating: 5, date: "1 week ago", comment: "Transparent, respectful, and incredibly effective. Will never go anywhere else." },
        { author: "Anita P.", platform: "Verified Patient", rating: 5, date: "2 weeks ago", comment: "Compassionate team and pristine facility. Worth every single penny." },
      ],
    },
    variants: [
      { id: "reviews-masonry-3col", name: "3-Column Card Masonry", description: "Dynamic vertical cards with source platform logos" },
      { id: "reviews-compact-ticker", name: "Compact Review Ticker", description: "Horizontal compact cards for footer or sidebar" },
    ],
    tags: ["social-proof", "reviews", "grid", "google", "trustpilot"],
  },
  {
    id: "social-proof-case-studies",
    name: "Clinical & Client Transformation Case Studies",
    family: "SOCIAL_PROOF",
    sectionType: "case-studies",
    description: "Detailed success stories presenting initial challenges, tailored interventions, and measurable outcomes.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["title", "caseStudies"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Heading", required: true, defaultValue: "Documented Patient & Client Outcomes" },
      { name: "caseStudies", type: "array", label: "Case Studies", description: "Array of case study cards", required: true, defaultValue: [
        { id: "cs1", title: "Complete Functional Rehabilitation", category: "Physical Recovery", timeframe: "12 Weeks", outcome: "100% Pain Reduction & Mobility Restored", summary: "Patient returned to full marathon training after tailored multidisciplinary program." },
        { id: "cs2", title: "Complex Aesthetic Correction", category: "Cosmetic Medicine", timeframe: "6 Weeks", outcome: "Natural Balanced Symmetry Achieved", summary: "Utilized minimally invasive laser and volume restoration protocols." },
      ]},
    ],
    defaultProps: {
      title: "Documented Patient & Client Outcomes",
      caseStudies: [
        { id: "cs1", title: "Complete Functional Rehabilitation", category: "Physical Recovery", timeframe: "12 Weeks", outcome: "100% Pain Reduction & Mobility Restored", summary: "Patient returned to full marathon training after tailored multidisciplinary program." },
        { id: "cs2", title: "Complex Aesthetic Correction", category: "Cosmetic Medicine", timeframe: "6 Weeks", outcome: "Natural Balanced Symmetry Achieved", summary: "Utilized minimally invasive laser and volume restoration protocols." },
      ],
    },
    variants: [
      { id: "case-studies-cards", name: "Two-Column Detailed Cards", description: "Side-by-side outcome cards with metric pills" },
    ],
    tags: ["social-proof", "case-studies", "results", "outcomes"],
  },
  {
    id: "social-proof-certifications-ribbon",
    name: "Accreditation & Industry Honors Ribbon",
    family: "SOCIAL_PROOF",
    sectionType: "certifications",
    description: "Continuous ribbon highlighting state licensure, medical board affiliations, and culinary/hospitality honors.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["items"],
    propDefinitions: [
      { name: "items", type: "array", label: "Honors & Badges", description: "List of honors", required: true, defaultValue: [
        "Board of Medical Examiners Approved",
        "Top Rated Practice 2024-2026",
        "Clean Facility Grade A+ Certification",
        "Excellence in Client Safety Standard",
      ]},
    ],
    defaultProps: {
      items: [
        "Board of Medical Examiners Approved",
        "Top Rated Practice 2024-2026",
        "Clean Facility Grade A+ Certification",
        "Excellence in Client Safety Standard",
      ],
    },
    variants: [
      { id: "certifications-marquee", name: "Smooth Scrolling Ribbon", description: "Infinite horizontal marquee strip" },
      { id: "certifications-static-bar", name: "Static Badge Bar", description: "Evenly spaced static badge bar" },
    ],
    tags: ["social-proof", "certifications", "ribbon", "accreditation"],
  },
  {
    id: "social-proof-partner-logos",
    name: "Corporate Partners & Affiliate Logo Cloud",
    family: "SOCIAL_PROOF",
    sectionType: "partners",
    description: "Clean monochrome logo grid displaying enterprise partners, insurance networks, and affiliated institutions.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["title", "logos"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Heading", required: true, defaultValue: "Accepted Insurance Networks & Institutional Partners" },
      { name: "logos", type: "array", label: "Partner Logos", description: "List of partners", required: true, defaultValue: [
        { name: "Blue Cross Blue Shield", category: "Insurance Network" },
        { name: "Aetna Preferred", category: "Insurance Network" },
        { name: "UnitedHealthcare", category: "Insurance Network" },
        { name: "Cigna Health", category: "Insurance Network" },
        { name: "National Care Alliance", category: "Affiliate" },
      ]},
    ],
    defaultProps: {
      title: "Accepted Insurance Networks & Institutional Partners",
      logos: [
        { name: "Blue Cross Blue Shield", category: "Insurance Network" },
        { name: "Aetna Preferred", category: "Insurance Network" },
        { name: "UnitedHealthcare", category: "Insurance Network" },
        { name: "Cigna Health", category: "Insurance Network" },
        { name: "National Care Alliance", category: "Affiliate" },
      ],
    },
    variants: [
      { id: "partner-logos-monochrome", name: "Monochrome Grid", description: "Subtle desaturated logos that highlight on hover" },
    ],
    tags: ["social-proof", "partners", "logos", "insurance"],
  },
];

