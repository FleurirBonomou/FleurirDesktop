export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'fleurir.desktop.theme'

/** Thème persisté, 'dark' par défaut (le CSS de base est le sombre). */
export function getStoredTheme(): ThemeMode {
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

/** Applique le thème sur <html> (data-theme='light' ; dark = pas d'attribut). */
export function applyTheme(theme: ThemeMode): void {
  if (theme === 'light') {
    document.documentElement.dataset.theme = 'light'
  } else {
    delete document.documentElement.dataset.theme
  }
}

/** Applique le thème persisté et le renvoie (utilisé au boot, avant le rendu). */
export function applyStoredTheme(): ThemeMode {
  const theme = getStoredTheme()
  applyTheme(theme)
  return theme
}

/** Persiste le thème choisi. */
export function storeTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, theme)
}