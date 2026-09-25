import { useState } from 'react'
import { applyTheme, getStoredTheme, storeTheme } from '../../lib/theme'

export function AppearancePanel(): React.JSX.Element {
  const [light, setLight] = useState<boolean>(() => getStoredTheme() === 'light')

  const toggleTheme = (): void => {
    const next = !light
    setLight(next)
    applyTheme(next ? 'light' : 'dark')
    storeTheme(next ? 'light' : 'dark')
  }

  return (
    <div className="settings-section">
      <div className="switch-row">
        <label className="switch-label" htmlFor="theme-light-toggle">
          <span>Thème clair</span>
          <span className="switch-warning">
            Fond vert très pâle avec la lumière radiale (équivalent du thème sombre).
          </span>
        </label>
        <input
          id="theme-light-toggle"
          type="checkbox"
          checked={light}
          onChange={toggleTheme}
        />
      </div>
    </div>
  )
}
