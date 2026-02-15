// Exact predefined skill list for the UnityAid platform
export const SKILL_LIST = [
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

// Legacy lists for backward compatibility
export const VOLUNTEER_SKILLS = SKILL_LIST;

export const ORGANIZER_SKILLS = [
    'Community Outreach',
    'Event Management',
    'Budget Planning',
    'Volunteer Coordination',
    'Partnership Building',
    'Digital Marketing',
    'Public Speaking',
    'Documentation & Reporting',
    'Grant Writing',
    'Safety Protocols',
    'Leadership',
    'Project Management',
    'Training & Development',
    'Strategic Planning'
];

// Get skill category
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

// Validate skill against allowed skills
export const isValidSkill = (skill, roleType = 'volunteer') => {
    if (roleType === 'volunteer') {
        return SKILL_LIST.includes(skill);
    } else if (roleType === 'organizer') {
        return SKILL_LIST.includes(skill);
    }
    return false;
};

// Validate skills array
export const validateSkills = (skills, roleType = 'volunteer') => {
    if (!Array.isArray(skills)) {
        return false;
    }
    return skills.every(skill => isValidSkill(skill, roleType));
};

// Get skill match percentage between volunteer and event
export const getSkillMatchPercentage = (volunteerSkills, eventRequiredSkills) => {
    if (!Array.isArray(volunteerSkills) || !Array.isArray(eventRequiredSkills)) {
        return 0;
    }

    if (eventRequiredSkills.includes('General Support')) {
        return 100; // Matches all events marked as General Support
    }

    const matches = volunteerSkills.filter(skill =>
        eventRequiredSkills.includes(skill)
    );

    return eventRequiredSkills.length > 0
        ? Math.round((matches.length / eventRequiredSkills.length) * 100)
        : 0;
};

// Get matched skills between volunteer and event
export const getMatchedSkills = (volunteerSkills, eventRequiredSkills) => {
    if (!Array.isArray(volunteerSkills) || !Array.isArray(eventRequiredSkills)) {
        return [];
    }

    return volunteerSkills.filter(skill =>
        eventRequiredSkills.includes(skill)
    );
};

// Check if volunteer has any matching skills with event
export const hasSkillMatch = (volunteerSkills, eventRequiredSkills) => {
    if (!Array.isArray(volunteerSkills) || !Array.isArray(eventRequiredSkills)) {
        return false;
    }

    // If event is open to all (General Support), volunteer matches
    if (eventRequiredSkills.includes('General Support')) {
        return true;
    }

    // Check if any volunteer skill matches event requirements
    return volunteerSkills.some(skill =>
        eventRequiredSkills.includes(skill)
    );
};

export default {
    VOLUNTEER_SKILLS,
    ORGANIZER_SKILLS,
    getSkillCategory,
    isValidSkill,
    validateSkills,
    getSkillMatchPercentage,
    getMatchedSkills,
    hasSkillMatch
};
