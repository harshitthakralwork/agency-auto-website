import { ComponentDefinition } from "../types";
import { heroDefinitions } from "./hero";
import { businessDefinitions } from "./business";
import { conversionDefinitions } from "./conversion";
import { socialProofDefinitions } from "./social-proof";
import { mediaDefinitions } from "./media";
import { contentDefinitions } from "./content";
import { advancedDefinitions } from "./advanced";

export const allComponentDefinitions: ComponentDefinition[] = [
  ...heroDefinitions,
  ...businessDefinitions,
  ...conversionDefinitions,
  ...socialProofDefinitions,
  ...mediaDefinitions,
  ...contentDefinitions,
  ...advancedDefinitions,
];

export {
  heroDefinitions,
  businessDefinitions,
  conversionDefinitions,
  socialProofDefinitions,
  mediaDefinitions,
  contentDefinitions,
  advancedDefinitions,
};

