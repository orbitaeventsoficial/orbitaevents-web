// Extends the Window interface with third-party globals

interface Window {
  /** Google Tag Manager / Analytics dataLayer */
  dataLayer: Record<string, unknown>[];
}
