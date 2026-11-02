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
      previewSnippet: {
        headline: "Nurturing Tomorrow's Innovators, Thinkers, and Leaders",
        subheadline: "Rigorous academics paired with ethical leadership and individualized mentorship.",
        actionLabel: "Explore Academic Programs",
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
      previewSnippet: {
        headline: "Proven Track Record of Unrivaled Success",
        subheadline: "Over 94% of our graduates matriculate into tier-1 universities and medical colleges.",
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
