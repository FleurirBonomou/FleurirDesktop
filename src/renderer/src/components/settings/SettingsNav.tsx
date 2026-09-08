import type { SettingsSection } from '../../pages/Settings'

interface SettingsNavProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

export function SettingsNav({
  activeSection,
  onSectionChange
}: SettingsNavProps): React.JSX.Element {
  const SECTIONS: { id: SettingsSection; label: string }[] = [
    { id: 'courses', label: 'Cours' },
    { id: 'review', label: 'Révision' },
    { id: 'appearance', label: 'Apparence' }
  ]
  return (
    <div className="settings-nav">
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={activeSection === section.id ? 'active' : ''}
          aria-current={activeSection === section.id ? 'page' : undefined}
          onClick={() => onSectionChange(section.id)}
        >
          {section.label}
        </button>
      ))}
    </div>
  )
}
