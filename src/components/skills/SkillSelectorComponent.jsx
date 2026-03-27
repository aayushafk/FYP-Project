import { useState } from 'react'

const SKILL_LIST = [
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
]

const SkillSelectorComponent = ({ 
  selectedSkills = [], 
  onSkillsChange, 
  error = null,
  required = true,
  mode = 'checkboxes'
}) => {
  const [showAll, setShowAll] = useState(false)
  
  const handleSkillToggle = (skill) => {
    if (!onSkillsChange) return
    
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill]
    onSkillsChange(updated)
  }

  const displaySkills = showAll ? SKILL_LIST : SKILL_LIST.slice(0, 6)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Select Your Skills {required && <span className="text-red-500">*</span>}
        </label>
        {selectedSkills.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedSkills.length} selected
          </span>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Select "General Support" if you're open to any task. 
          Choose specific skills that match your expertise.
        </p>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {displaySkills.map(skill => (
          <button
            key={skill}
            type="button"
            onClick={() => handleSkillToggle(skill)}
            className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm text-left ${
              selectedSkills.includes(skill)
                ? skill === 'General Support'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {skill === 'General Support' && selectedSkills.includes(skill) ? '✓ ' : ''}
            {skill}
          </button>
        ))}
      </div>

      {SKILL_LIST.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showAll ? '▼ Show less' : '▶ Show all skills'}
        </button>
      )}

      {/* Selected Skills Display */}
      {selectedSkills.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Your Selected Skills</p>
          {selectedSkills.includes('General Support') && (
            <div className="mb-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700 font-medium">
              ✓ Open to participate in any volunteer opportunity
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skill => (
              <div
                key={skill}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  skill === 'General Support'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary-100 text-primary-700'
                }`}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className="ml-1 hover:opacity-70 font-bold"
                  aria-label={`Remove ${skill}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Validation Message */}
      {required && selectedSkills.length === 0 && (
        <div className="text-sm text-gray-600">
          Please select at least one skill
        </div>
      )}
    </div>
  )
}

export default SkillSelectorComponent
