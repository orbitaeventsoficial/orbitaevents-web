// ============================================================
// LAYOUT SENSORIAL - SENSE HEADER NI FOOTER
// ============================================================
// Experiència immersiva sense distraccions
// ============================================================

export default function SensorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout completament buit - sense header, sense footer, sense res
  return <>{children}</>;
}

// Metadata específica per sensorial
export const metadata = {
  title: 'Espai Sensorial | Òrbita Events',
  description: 'Un espai digital per relaxar-te, meditar i desconnectar. Experiències immersives amb so, partícules i respiració guiada.',
  robots: 'noindex', // No indexar aquesta pàgina a Google
};
