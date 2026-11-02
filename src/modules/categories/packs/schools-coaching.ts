import { CategoryPack } from "../types";

export const schoolsCoachingPack: CategoryPack = {
  id: "schools-coaching",
  title: "Schools & Coaching",
  tagline: "Inspiring, structured educational pathways and student achievement",
  description:
    "Created for private schools, competitive exam coaching institutes, colleges, and online academies emphasizing syllabus rigor, student ranks, and admissions conversion.",
  iconName: "GraduationCap",
  badgeColor: "indigo",
  suggestedPreset: "corporate",
  keyFeatures: [
    "Program & Course Syllabus Explorer",
    "Admissions Timeline & Countdown",
    "Rank Holders & Exam Results Showcase",
    "Faculty Directory & Research Qualifications",
    "Online Application & Fee Inquiry Form",
    "Campus Tour & Virtual Classroom Preview",
  ],
  experienceAdaptations: {
    STANDARD: {
      level: "STANDARD",
      title: "Academic Clarity & Enrollment",
      tagline: "Structured curriculum tables, faculty lists, and admissions forms",
      characteristics: [
        "Clean course breakdown by grade and exam level",
        "Direct online seat registration forms",
        "Clear fee structure and scholarship schedules",
      ],
      recommendedComponents: ["CurriculumAccordion", "AdmissionsTimeline", "FacultyDirectory", "EnrollmentForm"],
    },
    CINEMATIC: {
      level: "CINEMATIC",
      title: "The Journey of Excellence",
      tagline: "Dynamic student learning documentary, mentor spotlight, and achievement stories",
      characteristics: [
        "High-energy video montage of science labs, robotic workshops, and athletic triumphs",
        "Student mastery before/after transformation (from foundational concepts to top national ranks)",
        "Pinned milestones timeline illustrating college placements and Ivy League acceptances",
      ],
      recommendedComponents: ["CampusVideoHero", "AchievementTransformationSlider", "PinnedMilestonesTimeline", "FacultyDialogueVideo"],
    },
    IMMERSIVE_3D: {
      level: "IMMERSIVE_3D",
      title: "Interactive Campus & STEM Lab",
      tagline: "3D interactive campus digital twin and virtual scientific apparatus",
      characteristics: [
        "Interactive 3D campus quad and lecture hall exploration with camera fly-ins",
        "Interactive 3D molecular structures / astronomical globes embedded in academic course cards",
        "Virtual science lab with interactive apparatus preview",
      ],
      recommendedComponents: ["CampusMap3D", "InteractiveScientificModel", "VirtualLabExplorer"],
    },
  },
  visualAssetRequirements: {
    imageStandard: "Professional campus, classroom, and faculty photography with natural sunlight (min 2800x1800).",
    videoFormat: "4K 60fps cinematic student life footage, laboratory close-ups, and graduation ceremonies.",
    frameSequenceSpecs: "90-frame sequence illustrating student progression through the academic year.",
    threeDModelSpecs: "Low-poly optimized 3D campus architecture and scientific instruments (Draco compressed under 10MB).",
  },
  animationRecommendations: [
    "Staggered number counter reveals for national rank holder percentages and scholarship awards.",
    "Horizontal scroll showcase for year-by-year academic wall of fame.",
  ],
  seoAndAccessibility: [
    "Accessible table semantics for complex fee structures and exam timetables.",
    "EducationalOrganization and Course Schema.org markup.",
  ],
  recommendedPages: [
    { id: "home", name: "Home", slug: "/", description: "Inspiring academic mission, achievements, and admissions highlights", isPrimary: true },
    { id: "academics", name: "Academics & Courses", slug: "/academics", description: "Curriculum breakdown, grade levels, and competitive batches", isPrimary: true },
    { id: "admissions", name: "Admissions & Aid", slug: "/admissions", description: "Eligibility criteria, key dates, fee structures, and application links", isPrimary: true },
    { id: "faculty", name: "Distinguished Faculty", slug: "/faculty", description: "Educators, department heads, and mentorship methodology", isPrimary: false },
    { id: "results", name: "Results & Alumni", slug: "/results", description: "College placements, board examination toppers, and testimonials", isPrimary: true },
    { id: "contact", name: "Campus Visit & Inquiries", slug: "/contact", description: "Campus location, open house registration, and contact forms", isPrimary: true },
  ],
  recommendedSections: [
    {
      id: "admissions_countdown",
      name: "Admissions Urgent Alert & Countdown",
      description: "Upcoming enrollment cycle deadline with immediate seat registration call-to-action.",
      defaultEnabled: true,
      order: 1,
      previewSnippet: {
        headline: "Admissions Open for Academic Year 2026-27",
        subheadline: "Early Application Round Closes Soon. Limited Seats in Honors and Advanced Batches.",
        actionLabel: "Apply Online Today",
      },
    },
    {
      id: "academic_hero",
      name: "Academic Excellence Hero Banner",
      description: "Mission statement, campus footage, and accredited curriculum highlights.",
      defaultEnabled: true,
      order: 2,
      cinematicHook: "Slow-motion video of students collaborating in advanced robotics lab with overlaid glowing equations.",
      threeDHook: "Rotating 3D academic crest or interactive floating globe that aligns with user scroll.",
      previewSnippet: {
        headline: "Nurturing Tomorrow's Innovators, Thinkers, and Leaders",
        subheadline: "Rigorous academics paired with ethical leadership and individualized mentorship.",
        actionLabel: "Explore Academic Programs",
        beforeLabel: "Standard Rote Memorization",
        afterLabel: "Empowered Scientific Critical Thinking",
      },
    },
    {
      id: "programs_grid",
      name: "Course Catalog & Specializations",
      description: "Interactive cards for STEM, Humanities, Competitive Batches, and Arts.",
      defaultEnabled: true,
      order: 3,
      previewSnippet: {
        headline: "Distinctive Academic Streams & Foundations",
        subheadline: "Designed to ignite curiosity and build foundational mastery from early grades to pre-university.",
      },
    },
    {
      id: "results_hall_of_fame",
      name: "Student Results & Wall of Fame",
      description: "National rank rankings, Olympiad medals, and prestigious university acceptances.",
      defaultEnabled: true,
      order: 4,
      cinematicHook: "Interactive Before/After slider demonstrating student mastery progress from baseline exam to top national percentile.",
      previewSnippet: {
        headline: "Proven Track Record of Unrivaled Success",
        subheadline: "Over 94% of our graduates matriculate into tier-1 universities and medical colleges.",
        beforeLabel: "Baseline Practice Score: 62%",
        afterLabel: "Final All-India Rank: Top 0.1%",
      },
    },
    {
      id: "faculty_mentorship",
      name: "Faculty Profiles & Pedagogy",
      description: "Spotlight on PhDs, master instructors, and small student-to-teacher ratios.",
      defaultEnabled: true,
      order: 5,
      previewSnippet: {
        headline: "Mentorship by World-Class Educators",
        subheadline: "12:1 student-to-faculty ratio ensuring dedicated individualized attention for every student.",
      },
    },
  ],
};
