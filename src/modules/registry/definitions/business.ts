import { ComponentDefinition } from "../types";

export const businessDefinitions: ComponentDefinition[] = [
  {
    id: "business-about",
    name: "Brand Ethos & About Story",
    family: "BUSINESS",
    sectionType: "about",
    description: "Narrative section showcasing organization heritage, mission statement, core pillars, and verified credentials.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC", "IMMERSIVE_3D"],
    requiredProps: ["eyebrow", "title", "storyParagraphs", "highlightValue", "highlightLabel"],
    propDefinitions: [
      { name: "eyebrow", type: "string", label: "Eyebrow Tag", description: "Small category or heritage tag", required: true, defaultValue: "Our Philosophy" },
      { name: "title", type: "string", label: "Section Title", description: "Main section heading", required: true, defaultValue: "Built on Uncompromising Standards and Authentic Care" },
      { name: "storyParagraphs", type: "array", label: "Story Paragraphs", description: "Narrative text blocks", required: true, defaultValue: ["Founded with an unwavering commitment to mastery, we combine deep specialized domain expertise with modern technology.", "Every detail is thoughtfully considered, ensuring each patient, guest, or patron receives personalized attention of the highest caliber."] },
      { name: "highlightValue", type: "string", label: "Key Milestone", description: "Prominent stat (e.g., '15+ Years')", required: true, defaultValue: "15+ Years" },
      { name: "highlightLabel", type: "string", label: "Milestone Label", description: "Label for the milestone", required: true, defaultValue: "Serving the Community with Distinction" },
      { name: "quoteText", type: "string", label: "Founder Quote", description: "Optional inspirational quote", required: false, defaultValue: "\"True excellence is never an accident; it is the result of intention and mastery.\"" },
    ],
    defaultProps: {
      eyebrow: "Our Philosophy",
      title: "Built on Uncompromising Standards and Authentic Care",
      storyParagraphs: [
        "Founded with an unwavering commitment to mastery, we combine deep specialized domain expertise with modern technology.",
        "Every detail is thoughtfully considered, ensuring each patient, guest, or patron receives personalized attention of the highest caliber.",
      ],
      highlightValue: "15+ Years",
      highlightLabel: "Serving the Community with Distinction",
      quoteText: "\"True excellence is never an accident; it is the result of intention and mastery.\"",
    },
    variants: [
      { id: "about-split-quote", name: "Split Story with Quote", description: "Paragraphs on one side, large quotation & metric card on the other" },
      { id: "about-timeline-cards", name: "Pillar Cards Layout", description: "Story introduction followed by 3 core philosophy cards" },
    ],
    tags: ["business", "about", "story", "heritage", "pillars"],
  },
  {
    id: "business-services",
    name: "Interactive Services Grid",
    family: "BUSINESS",
    sectionType: "services",
    description: "Structured card grid detailing primary services, features, deliverables, and direct inquiry triggers.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC", "IMMERSIVE_3D"],
    requiredProps: ["eyebrow", "title", "description", "servicesList"],
    propDefinitions: [
      { name: "eyebrow", type: "string", label: "Eyebrow", description: "Category badge", required: true, defaultValue: "What We Offer" },
      { name: "title", type: "string", label: "Title", description: "Main heading", required: true, defaultValue: "Specialized Services Tailored to Your Needs" },
      { name: "description", type: "string", label: "Description", description: "Subheading overview", required: true, defaultValue: "Explore our comprehensive suite of certified offerings led by seasoned specialists." },
      { name: "servicesList", type: "array", label: "Services", description: "List of service objects (title, description, tags, cta)", required: true, defaultValue: [
        { id: "s1", title: "Primary Consultation & Diagnostic", description: "Thorough assessment utilizing cutting-edge diagnostic standards.", tag: "Most Popular", cta: "Schedule" },
        { id: "s2", title: "Advanced Specialized Care", description: "Custom-tailored protocols formulated for optimal outcomes and rapid recovery.", tag: "Specialized", cta: "Learn More" },
        { id: "s3", title: "Preventative Maintenance & Wellness", description: "Long-term ongoing support plans to preserve peak vitality and performance.", tag: "Comprehensive", cta: "Inquire" },
      ]},
    ],
    defaultProps: {
      eyebrow: "What We Offer",
      title: "Specialized Services Tailored to Your Needs",
      description: "Explore our comprehensive suite of certified offerings led by seasoned specialists.",
      servicesList: [
        { id: "s1", title: "Primary Consultation & Diagnostic", description: "Thorough assessment utilizing cutting-edge diagnostic standards.", tag: "Most Popular", cta: "Schedule" },
        { id: "s2", title: "Advanced Specialized Care", description: "Custom-tailored protocols formulated for optimal outcomes and rapid recovery.", tag: "Specialized", cta: "Learn More" },
        { id: "s3", title: "Preventative Maintenance & Wellness", description: "Long-term ongoing support plans to preserve peak vitality and performance.", tag: "Comprehensive", cta: "Inquire" },
      ],
    },
    variants: [
      { id: "services-cards-grid", name: "3-Column Cards Grid", description: "High-contrast cards with badges, icons, and action links" },
      { id: "services-accordion-list", name: "Expandable Detail List", description: "Clean horizontal rows that expand to show sub-services" },
    ],
    tags: ["business", "services", "cards", "offerings"],
  },
  {
    id: "business-features",
    name: "Key Features & Differentiators",
    family: "BUSINESS",
    sectionType: "features",
    description: "Grid highlighting core capabilities, proprietary methodology, and competitive advantages.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC", "IMMERSIVE_3D"],
    requiredProps: ["title", "features"],
    propDefinitions: [
      { name: "title", type: "string", label: "Section Title", description: "Main heading", required: true, defaultValue: "Why Discerning Clients Choose Us" },
      { name: "features", type: "array", label: "Features List", description: "List of features with title and description", required: true, defaultValue: [
        { title: "Accredited Specialists", description: "Every practitioner holds premier industry certifications and ongoing credentials." },
        { title: "Advanced Equipment", description: "Utilizing modern state-of-the-art tools and sterile medical-grade environments." },
        { title: "Transparent Guidance", description: "No hidden fees, explicit treatment or service plans, and round-the-clock advisory." },
        { title: "Bespoke Protocols", description: "Individualized attention tuned precisely to your unique objectives." },
      ]},
    ],
    defaultProps: {
      title: "Why Discerning Clients Choose Us",
      features: [
        { title: "Accredited Specialists", description: "Every practitioner holds premier industry certifications and ongoing credentials." },
        { title: "Advanced Equipment", description: "Utilizing modern state-of-the-art tools and sterile medical-grade environments." },
        { title: "Transparent Guidance", description: "No hidden fees, explicit treatment or service plans, and round-the-clock advisory." },
        { title: "Bespoke Protocols", description: "Individualized attention tuned precisely to your unique objectives." },
      ],
    },
    variants: [
      { id: "features-icon-grid", name: "4-Column Icon Grid", description: "Clean 4-column layout with icon badges" },
      { id: "features-alternate-blocks", name: "Alternating Feature Blocks", description: "Two-tone alternating feature blocks with prominent numbering" },
    ],
    tags: ["business", "features", "differentiators", "usps"],
  },
  {
    id: "business-benefits",
    name: "Quantitative Benefits & Value Proposition",
    family: "BUSINESS",
    sectionType: "benefits",
    description: "Focuses on tangible benefits and measurable client outcomes with percentage indicators.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["title", "benefits"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Heading", required: true, defaultValue: "Measurable Value from Day One" },
      { name: "benefits", type: "array", label: "Benefits", description: "Array of benefit cards with metric", required: true, defaultValue: [
        { metric: "98%", label: "Satisfaction Rate", desc: "Consistently rated 5 stars by verified patients and clients across all reviews." },
        { metric: "2.5x", label: "Faster Turnaround", desc: "Streamlined workflow and dedicated coordinators accelerate your experience." },
        { metric: "100%", label: "Safety Compliance", desc: "Rigorous adherence to federal, clinical, and environmental standards." },
      ]},
    ],
    defaultProps: {
      title: "Measurable Value from Day One",
      benefits: [
        { metric: "98%", label: "Satisfaction Rate", desc: "Consistently rated 5 stars by verified patients and clients across all reviews." },
        { metric: "2.5x", label: "Faster Turnaround", desc: "Streamlined workflow and dedicated coordinators accelerate your experience." },
        { metric: "100%", label: "Safety Compliance", desc: "Rigorous adherence to federal, clinical, and environmental standards." },
      ],
    },
    variants: [
      { id: "benefits-metric-cards", name: "Prominent Metric Cards", description: "Large numeric callouts atop concise value explanations" },
    ],
    tags: ["business", "benefits", "value", "metrics"],
  },
  {
    id: "business-process",
    name: "Step-by-Step Workflow & Process",
    family: "BUSINESS",
    sectionType: "process",
    description: "Visual roadmap outlining client onboarding, consultation, treatment or service execution, and follow-up.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["title", "steps"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Heading", required: true, defaultValue: "Our Four-Stage Client Journey" },
      { name: "steps", type: "array", label: "Steps", description: "Step items", required: true, defaultValue: [
        { step: "01", title: "Initial Discovery", desc: "Confidential in-depth assessment to identify your precise needs and goals." },
        { step: "02", title: "Bespoke Planning", desc: "Customized strategy formulated by our lead specialists with transparent pricing." },
        { step: "03", title: "Mastery Execution", desc: "Precision implementation using advanced techniques in our certified facility." },
        { step: "04", title: "Ongoing Support", desc: "Dedicated follow-up check-ins and tailored long-term maintenance protocols." },
      ]},
    ],
    defaultProps: {
      title: "Our Four-Stage Client Journey",
      steps: [
        { step: "01", title: "Initial Discovery", desc: "Confidential in-depth assessment to identify your precise needs and goals." },
        { step: "02", title: "Bespoke Planning", desc: "Customized strategy formulated by our lead specialists with transparent pricing." },
        { step: "03", title: "Mastery Execution", desc: "Precision implementation using advanced techniques in our certified facility." },
        { step: "04", title: "Ongoing Support", desc: "Dedicated follow-up check-ins and tailored long-term maintenance protocols." },
      ],
    },
    variants: [
      { id: "process-linear-timeline", name: "Linear Timeline", description: "Horizontal connecting line with numbered milestones" },
      { id: "process-grid-steps", name: "Numbered 4-Grid", description: "Clean four-card grid with oversized stage numbers" },
    ],
    tags: ["business", "process", "workflow", "steps"],
  },
  {
    id: "business-stats",
    name: "Key Performance & Impact Statistics",
    family: "BUSINESS",
    sectionType: "stats",
    description: "High-impact counter strip highlighting community trust, years in practice, and service volume.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["stats"],
    propDefinitions: [
      { name: "stats", type: "array", label: "Statistics", description: "Array of numerical highlights", required: true, defaultValue: [
        { number: "15,000+", label: "Appointments Completed" },
        { number: "99.4%", label: "Client Recommendation" },
        { number: "25+", label: "Certified Specialists" },
        { number: "18", label: "Industry Accreditations" },
      ]},
    ],
    defaultProps: {
      stats: [
        { number: "15,000+", label: "Appointments Completed" },
        { number: "99.4%", label: "Client Recommendation" },
        { number: "25+", label: "Certified Specialists" },
        { number: "18", label: "Industry Accreditations" },
      ],
    },
    variants: [
      { id: "stats-inline-strip", name: "Inline Banner Strip", description: "Sleek horizontal divider banner with high contrast" },
      { id: "stats-boxed-grid", name: "Boxed Metric Cards", description: "Individual bordered cards with subtle glassmorphic backdrop" },
    ],
    tags: ["business", "stats", "counters", "trust"],
  },
  {
    id: "business-team",
    name: "Specialist & Leadership Profiles",
    family: "BUSINESS",
    sectionType: "team",
    description: "Profiles of lead doctors, chefs, trainers, or educators with credentials, bio, and direct booking trigger.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["title", "members"],
    propDefinitions: [
      { name: "title", type: "string", label: "Title", description: "Section heading", required: true, defaultValue: "Led by Renowned Industry Authorities" },
      { name: "members", type: "array", label: "Team Members", description: "List of team member objects", required: true, defaultValue: [
        { name: "Dr. Elena Vance, MD", role: "Medical Director & Chief Surgeon", credentials: "Board Certified • 18 Yrs Exp", image: "/images/placeholders/team-1.jpg" },
        { name: "Marcus Thorne", role: "Head of Clinical Operations", credentials: "Fellow of American College • 12 Yrs Exp", image: "/images/placeholders/team-2.jpg" },
        { name: "Aria Chen", role: "Lead Patient Care Specialist", credentials: "Certified Patient Advocate • 8 Yrs Exp", image: "/images/placeholders/team-3.jpg" },
      ]},
    ],
    defaultProps: {
      title: "Led by Renowned Industry Authorities",
      members: [
        { name: "Dr. Elena Vance, MD", role: "Medical Director & Chief Surgeon", credentials: "Board Certified • 18 Yrs Exp", image: "/images/placeholders/team-1.jpg" },
        { name: "Marcus Thorne", role: "Head of Clinical Operations", credentials: "Fellow of American College • 12 Yrs Exp", image: "/images/placeholders/team-2.jpg" },
        { name: "Aria Chen", role: "Lead Patient Care Specialist", credentials: "Certified Patient Advocate • 8 Yrs Exp", image: "/images/placeholders/team-3.jpg" },
      ],
    },
    variants: [
      { id: "team-cards-grid", name: "Photo Cards Grid", description: "Clean photo cards with credential badges and bio snippets" },
    ],
    tags: ["business", "team", "specialists", "leadership"],
  },
  {
    id: "business-trust-badges",
    name: "Official Trust Badges & Accreditations",
    family: "BUSINESS",
    sectionType: "trust-badges",
    description: "Accreditation ribbon displaying clinical boards, hygiene certificates, and consumer awards.",
    supportedExperienceLevels: ["STANDARD", "CINEMATIC"],
    requiredProps: ["badges"],
    propDefinitions: [
      { name: "heading", type: "string", label: "Heading", description: "Optional title", required: false, defaultValue: "Accredited & Certified by Premier Institutions" },
      { name: "badges", type: "array", label: "Badges", description: "Array of badge labels/icons", required: true, defaultValue: [
        { label: "ISO 9001 Certified Quality", icon: "shield-check" },
        { label: "HIPAA Compliant Data Standards", icon: "lock" },
        { label: "National Board Certified 2026", icon: "award" },
        { label: "5-Star Consumer Choice Winner", icon: "star" },
      ]},
    ],
    defaultProps: {
      heading: "Accredited & Certified by Premier Institutions",
      badges: [
        { label: "ISO 9001 Certified Quality", icon: "shield-check" },
        { label: "HIPAA Compliant Data Standards", icon: "lock" },
        { label: "National Board Certified 2026", icon: "award" },
        { label: "5-Star Consumer Choice Winner", icon: "star" },
      ],
    },
    variants: [
      { id: "trust-ribbon-horizontal", name: "Horizontal Marquee Ribbon", description: "Continuous horizontal ribbon" },
      { id: "trust-grid-tiles", name: "Square Accreditation Tiles", description: "Structured tiles with icons and verification notes" },
    ],
    tags: ["business", "trust", "accreditation", "badges", "certifications"],
  },
];

