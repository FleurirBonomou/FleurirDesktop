import { ReviewConfigPanel } from '@renderer/components/settings/ReviewConfigPanel'
import { AppearancePanel } from '@renderer/components/settings/AppearancePanel'
import { CoursesPanel } from '@renderer/components/settings/CoursesPanel'
import { useState } from 'react'
import { SettingsNav } from '@renderer/components/settings/SettingsNav'

export type SettingsSection = 'review' | 'courses' | 'appearance'

function Settings(): React.JSX.Element {
  const SECTION_COMPONENTS = {
    courses: CoursesPanel,
    review: ReviewConfigPanel,
    appearance: AppearancePanel
  }

  const [activeSection, setActiveSection] = useState<SettingsSection>('courses')

  const ActivePanel = SECTION_COMPONENTS[activeSection]

  return (
    <div className="radial-bg">
      <div className="settings-layout">
        <SettingsNav activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="settings-panel">
          <ActivePanel />
        </div>
      </div>
    </div>
  )
}

export default Settings
