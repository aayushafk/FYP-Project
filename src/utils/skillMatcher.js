/**
 * Skill Matching Utilities for UnityAid Platform
 * Handles all volunteer-event skill compatibility calculations
 */

export const VOLUNTEER_SKILLS = [
  'General Support',
  'First Aid',
  'Medical Assistance',
  'Food Distribution',
  'Logistics & Transport',
  'Crowd Management',
  'Teaching & Tutoring',
  'Disaster Relief',
  'Counseling Support',
  'Technical Support',
  'Translation'
];

/**
 * Calculate skill match percentage for a volunteer with an event
 * @param {Array} volunteerSkills - Array of skills the volunteer has
 * @param {Array} requiredSkills - Array of skills required by the event
 * @returns {Object} Matching details including percentage and matched skills
 */
export const calculateSkillMatch = (volunteerSkills = [], requiredSkills = []) => {
  // No skills required - everyone can join
  if (!requiredSkills || requiredSkills.length === 0) {
    return {
      canJoin: true,
      percentage: 100,
      message: 'No specific skills required',
      isOpenToAll: true,
      matchedSkills: []
    };
  }

  // Check for General Support
  if (requiredSkills.includes('General Support')) {
    return {
      canJoin: true,
      percentage: 100,
      message: 'Event open to all volunteers',
      isOpenToAll: true,
      matchedSkills: ['General Support']
    };
  }

  // Calculate actual skill matches
  const matched = volunteerSkills.filter(skill =>
    requiredSkills.includes(skill)
  );

  const percentage = requiredSkills.length > 0
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 0;

  const skillGap = requiredSkills.filter(skill => !matched.includes(skill));

  return {
    canJoin: matched.length > 0,
    percentage,
    message: matched.length > 0
      ? `${matched.length} of ${requiredSkills.length} skills match`
      : 'No matching skills',
    isOpenToAll: false,
    matchedSkills: matched,
    skillGap
  };
};

/**
 * Get visual badge information for skill match status
 * @param {Object} skillMatch - Result from calculateSkillMatch
 * @returns {Object} Badge styling and text information
 */
export const getSkillMatchBadge = (skillMatch) => {
  if (skillMatch.isOpenToAll) {
    return {
      text: 'Open to All',
      icon: '🌍',
      color: 'green',
      bgClass: 'bg-green-100',
      textClass: 'text-green-700',
      borderClass: 'border-green-200'
    };
  }

  if (skillMatch.percentage === 100 && skillMatch.percentage > 0) {
    return {
      text: 'Perfect Match',
      icon: '✓',
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200'
    };
  }

  if (skillMatch.percentage >= 50) {
    return {
      text: `${skillMatch.percentage}% Match`,
      icon: '⚠️',
      color: 'yellow',
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-700',
      borderClass: 'border-yellow-200'
    };
  }

  if (skillMatch.percentage > 0) {
    return {
      text: `${skillMatch.percentage}% Match`,
      icon: '↓',
      color: 'orange',
      bgClass: 'bg-orange-100',
      textClass: 'text-orange-700',
      borderClass: 'border-orange-200'
    };
  }

  return {
    text: 'No Match',
    icon: '✕',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-200'
  };
};

/**
 * Get skill category for coloring/grouping
 * @param {String} skill - The skill name
 * @returns {String} Category of the skill
 */
export const getSkillCategory = (skill) => {
  const categories = {
    'Medical': ['First Aid', 'Medical Assistance', 'Counseling Support'],
    'Emergency': ['Crowd Management', 'Disaster Relief'],
    'Logistics': ['Food Distribution', 'Logistics & Transport'],
    'Education': ['Teaching & Tutoring', 'Technical Support'],
    'General': ['General Support'],
    'Communication': ['Translation']
  };

  for (const [category, skills] of Object.entries(categories)) {
    if (skills.includes(skill)) {
      return category;
    }
  }
  return 'Other';
};

/**
 * Filter events by volunteer skill match
 * @param {Array} events - Array of events to filter
 * @param {Array} volunteerSkills - Volunteer's skills
 * @param {Number} minMatchPercentage - Minimum match percentage to include
 * @returns {Array} Filtered and sorted events
 */
export const filterEventsBySkillMatch = (
  events = [],
  volunteerSkills = [],
  minMatchPercentage = 0
) => {
  return events
    .map(event => {
      const skillMatch = calculateSkillMatch(volunteerSkills, event.requiredSkills);
      return {
        ...event,
        skillMatch,
        matchScore: skillMatch.percentage
      };
    })
    .filter(eventWithMatch => eventWithMatch.matchScore >= minMatchPercentage)
    .sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Suggest skills for a volunteer based on event participation
 * @param {Array} pastEventSkills - Skills from events they participated in
 * @param {Array} currentSkills - Skills currently listed
 * @returns {Array} Suggested skills to add
 */
export const suggestSkills = (pastEventSkills = [], currentSkills = []) => {
  // Find skills that appear in past events but aren't claimed yet
  const countBySkill = {};

  pastEventSkills.forEach(skill => {
    if (!currentSkills.includes(skill)) {
      countBySkill[skill] = (countBySkill[skill] || 0) + 1;
    }
  });

  // Return top 3 suggestions
  return Object.entries(countBySkill)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill]) => skill);
};

/**
 * Format skills for display in UI
 * @param {Array} skills - Array of skill strings
 * @returns {String} Formatted skill list
 */
export const formatSkillsList = (skills = []) => {
  if (skills.length === 0) return 'No skills specified';
  if (skills.length === 1) return skills[0];
  if (skills.length === 2) return `${skills[0]} & ${skills[1]}`;
  return `${skills.slice(0, -1).join(', ')} & ${skills[skills.length - 1]}`;
};

/**
 * Validate skills against the predefined list
 * @param {Array} skills - Skills to validate
 * @returns {Object} Validation result with valid and invalid skills
 */
export const validateSkills = (skills = []) => {
  const valid = skills.filter(skill => VOLUNTEER_SKILLS.includes(skill));
  const invalid = skills.filter(skill => !VOLUNTEER_SKILLS.includes(skill));

  return {
    isValid: invalid.length === 0,
    valid,
    invalid,
    message: invalid.length > 0
      ? `Invalid skills: ${invalid.join(', ')}`
      : 'All skills are valid'
  };
};

/**
 * Get related skills for recommendation
 * @param {String} skill - The skill to find relations for
 * @returns {Array} Array of related skills
 */
export const getRelatedSkills = (skill) => {
  const relations = {
    'First Aid': ['Medical Assistance', 'Disaster Relief', 'Counseling Support'],
    'Medical Assistance': ['First Aid', 'Disaster Relief'],
    'Food Distribution': ['Logistics & Transport', 'Crowd Management'],
    'Logistics & Transport': ['Food Distribution', 'Crowd Management'],
    'Crowd Management': ['Logistics & Transport', 'Disaster Relief'],
    'Teaching & Tutoring': ['Technical Support'],
    'Technical Support': ['Teaching & Tutoring'],
    'Disaster Relief': ['First Aid', 'Medical Assistance', 'Crowd Management'],
    'Counseling Support': ['First Aid', 'Disaster Relief'],
    'Translation': ['Teaching & Tutoring'],
    'General Support': VOLUNTEER_SKILLS.filter(s => s !== 'General Support')
  };

  return relations[skill] || [];
};

export default {
  VOLUNTEER_SKILLS,
  calculateSkillMatch,
  getSkillMatchBadge,
  getSkillCategory,
  filterEventsBySkillMatch,
  suggestSkills,
  formatSkillsList,
  validateSkills,
  getRelatedSkills
};
