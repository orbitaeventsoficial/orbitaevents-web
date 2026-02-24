// Extends the Window interface with third-party globals

interface Window {
  /** Google Tag Manager / Analytics dataLayer — accepts both objects and gtag arg arrays */
  dataLayer?: Array<Record<string, unknown> | unknown[]>;
  /** gtag() shim */
  gtag?: (...args: [string, ...unknown[]]) => void;
  /** Consent update callback injected by analytics script */
  gtagConsentUpdate?: () => void;
}
