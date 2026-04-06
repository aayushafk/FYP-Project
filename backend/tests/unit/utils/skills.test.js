import {
  validateSkills,
  getSkillCategories,
  getSkillsByCategory,
  getAllSkillsGrouped,
  SKILL_CATEGORIES,
  SKILLS,
  VOLUNTEER_SKILLS
} from '../../../utils/skills.js';

describe('skills utilities', () => {
  describe('validateSkills', () => {
    it('returns false when skills is not an array', () => {
      expect(validateSkills('First Aid')).toBe(false);
      expect(validateSkills(null)).toBe(false);
    });

    it('returns true for an empty array', () => {
      expect(validateSkills([])).toBe(true);
    });

    it('returns true when all skills are valid', () => {
      expect(validateSkills(['First Aid', 'General Support'])).toBe(true);
    });

    it('returns false when any skill is invalid', () => {
      expect(validateSkills(['First Aid', 'Unknown Skill'])).toBe(false);
    });

    it('returns false when a non-string item is passed', () => {
      expect(validateSkills(['First Aid', 123])).toBe(false);
    });
  });

  describe('category and skill getters', () => {
    it('returns all skill categories', () => {
      expect(getSkillCategories()).toEqual(SKILL_CATEGORIES);
    });

    it('returns skills for a valid category', () => {
      expect(getSkillsByCategory(SKILL_CATEGORIES.MEDICAL)).toEqual(SKILLS[SKILL_CATEGORIES.MEDICAL]);
    });

    it('returns an empty array for an unknown category', () => {
      expect(getSkillsByCategory('Unknown Category')).toEqual([]);
    });

    it('returns grouped skills and flattened volunteer skills', () => {
      expect(getAllSkillsGrouped()).toEqual(SKILLS);
      expect(VOLUNTEER_SKILLS).toContain('General Support');
    });
  });
});
