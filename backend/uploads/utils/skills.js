// Skills List - Backend Version
export const SKILL_CATEGORIES = {
  GENERAL: 'General Support',
  MEDICAL: 'Medical & Health',
  EMERGENCY: 'Emergency & Rescue',
  LOGISTICS: 'Logistics & Support',
  EDUCATION: 'Education & Training',
  CARE: 'Care Services',
  EVENT: 'Event & Community',
  COMMUNICATION: 'Communication',
  PROFESSIONAL: 'Professional Services'
};

export const SKILLS = {
  [SKILL_CATEGORIES.GENERAL]: [
    'General Support'
  ],
  [SKILL_CATEGORIES.MEDICAL]: [
    'First Aid',
    'Medical Assistance',
    'Nursing',
    'CPR Certification',
    'Health Education'
  ],
  [SKILL_CATEGORIES.EMERGENCY]: [
    'Disaster Relief',
    'Emergency Response',
    'Crisis Management',
    'Search & Rescue',
    'Safety Management'
  ],
  [SKILL_CATEGORIES.LOGISTICS]: [
    'Logistics & Transport',
    'Inventory Management',
    'Food Distribution',
    'Supply Chain',
    'Warehouse Management'
  ],
  [SKILL_CATEGORIES.EDUCATION]: [
    'Teaching & Tutoring',
    'Curriculum Development',
    'Student Mentoring',
    'Training & Development',
    'Technical Training'
  ],
  [SKILL_CATEGORIES.CARE]: [
    'Childcare',
    'Elder Care',
    'Disability Support',
    'Mental Health Support',
    'Counseling Support'
  ],
  [SKILL_CATEGORIES.EVENT]: [
    'Event Planning',
    'Community Organizing',
    'Marketing & Outreach',
    'Public Relations',
    'Crowd Management'
  ],
  [SKILL_CATEGORIES.COMMUNICATION]: [
    'Translation',
    'Public Speaking',
    'Communication Skills',
    'Social Media Management',
    'Content Writing'
  ],
  [SKILL_CATEGORIES.PROFESSIONAL]: [
    'Technical Support',
    'IT Support',
    'Legal Services',
    'Financial Services',
    'Project Management'
  ]
};

// Get all skills as flat array
export const SKILL_LIST = Object.values(SKILLS).flat();

// Export as VOLUNTEER_SKILLS for backward compatibility
export const VOLUNTEER_SKILLS = SKILL_LIST;

// Skill Levels
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

/**
 * Validate if provided skills are valid
 * @param {Array<string>} skills - Array of skill names to validate
 * @param {string} type - Type of validation ('volunteer', 'request', etc.)
 * @returns {boolean} - True if all skills are valid, false otherwise
 */
export function validateSkills(skills, type = 'volunteer') {
  if (!Array.isArray(skills)) {
    return false;
  }

  // Empty array is valid
  if (skills.length === 0) {
    return true;
  }

  // Check if all skills are in the valid skills list
  const validSkillsSet = new Set(VOLUNTEER_SKILLS);
  
  return skills.every(skill => {
    // Check if skill is a string
    if (typeof skill !== 'string') {
      return false;
    }
    
    // Check if skill exists in valid skills list
    return validSkillsSet.has(skill);
  });
}

/**
 * Get all available skill categories
 * @returns {Object} - Object containing all skill categories
 */
export function getSkillCategories() {
  return SKILL_CATEGORIES;
}

/**
 * Get skills by category
 * @param {string} category - Category name
 * @returns {Array<string>} - Array of skills in the category
 */
export function getSkillsByCategory(category) {
  return SKILLS[category] || [];
}

/**
 * Get all skills grouped by category
 * @returns {Object} - Object with categories as keys and skill arrays as values
 */
export function getAllSkillsGrouped() {
  return SKILLS;
}
