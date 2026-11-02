import { CategoryPack } from "../types";

export const healthcarePack: CategoryPack = {
  id: "healthcare",
  title: "Healthcare & Medical",
  tagline: "Empathetic, credible, and clinical trust-building experiences",
  description:
    "Engineered for hospitals, specialty clinics, dental practices, and wellness centers requiring clinical rigor, appointment scheduling, and patient clarity.",
  iconName: "Stethoscope",
  badgeColor: "emerald",
  suggestedPreset: "corporate",
  keyFeatures: [
    "Online Doctor Consultation Booking",
    "Specialist Profiles & Medical Credentials",
    "Emergency Care Alert Banners",
    "Insurance & Billing Guidance",
    "HIPAA-Compliant Contact Inquiries",
    "Departmental Service Directory",
  ],
  recommendedPages: [
    { id: "home", name: "Home", slug: "/", description: "Patient landing page with emergency contacts and top specialties", isPrimary: true },
    { id: "doctors", name: "Specialists & Doctors", slug: "/doctors", description: "Physician directory with credentials and availability", isPrimary: true },
    { id: "departments", name: "Departments & Services", slug: "/departments", description: "Clinical specialty treatments and medical technology", isPrimary: true },
    { id: "patient-portal", name: "Patient Resources", slug: "/patient-resources", description: "First-visit forms, FAQs, and insurance information", isPrimary: false },
    { id: "about", name: "About Clinic", slug: "/about", description: "Mission, accreditations, and medical facility overview", isPrimary: false },
    { id: "contact", name: "Appointments & Contact", slug: "/contact", description: "Interactive map, phone numbers, and booking forms", isPrimary: true },
  ],
  recommendedSections: [
    {
      id: "emergency_banner",
      name: "Emergency & Quick Triage Banner",
      description: "Direct dial emergency telephone hotline and urgent care hours.",
      defaultEnabled: true,
      order: 1,
      previewSnippet: {
        headline: "Need Immediate Medical Attention?",
        subheadline: "24/7 Urgent Care Helpline: (800) 555-CARE | Walk-ins Welcomed",
        actionLabel: "Call ER Hotline",
      },
    },
    {
      id: "hero_appointment",
      name: "Hero with Appointment Booking CTA",
      description: "Primary value proposition, trust metrics, and appointment scheduler.",
      defaultEnabled: true,
      order: 2,
      previewSnippet: {
        headline: "Compassionate, World-Class Medical Care for Your Entire Family",
        subheadline: "Board-certified physicians, state-of-the-art diagnostic technology, and personalized healing pathways.",
        actionLabel: "Book an Appointment",
      },
    },
    {
      id: "specialties_grid",
      name: "Specialties & Clinical Departments",
      description: "Grid highlighting cardiology, neurology, pediatrics, orthopedics, etc.",
      defaultEnabled: true,
      order: 3,
      previewSnippet: {
        headline: "Comprehensive Centers of Excellence",
        subheadline: "Specialized clinical teams equipped with precision diagnostic and surgical capabilities.",
      },
    },
    {
      id: "doctor_spotlight",
      name: "Physician Credentials & Leadership",
      description: "Profile cards highlighting top specialists, degrees, and hospital affiliations.",
      defaultEnabled: true,
      order: 4,
      previewSnippet: {
        headline: "Meet Our Chief Medical Specialists",
        subheadline: "Distinguished physicians dedicated to evidence-based outcomes and empathetic care.",
        actionLabel: "View All Physicians",
      },
    },
    {
      id: "patient_testimonials",
      name: "Patient Recovery Stories & Outcomes",
      description: "Verified patient recovery narratives and patient satisfaction metrics.",
      defaultEnabled: true,
      order: 5,
      previewSnippet: {
        headline: "Patient Voices & Recovery Journeys",
        subheadline: "98.4% patient satisfaction rating across inpatient and outpatient care centers.",
      },
    },
    {
      id: "insurance_faq",
      name: "Insurance Acceptance & Financial Clarity",
      description: "List of accepted insurance networks and clear billing FAQ accordions.",
      defaultEnabled: false,
      order: 6,
      previewSnippet: {
        headline: "Insurance Networks & Transparent Billing",
        subheadline: "We partner with over 40 leading healthcare networks to keep care accessible.",
      },
    },
  ],
};
