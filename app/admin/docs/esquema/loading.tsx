const SKEL = 'bg-[var(--ax-raised)] rounded-[var(--o-r-md)] motion-safe:animate-pulse';

export default function Loading() {
  return (
    <div className="mx-auto max-w-[64rem]" aria-busy="true" aria-label="Carregant esquema…">
      <div className={`${SKEL} h-8 w-2/5 mb-6`} />
      <div className={`${SKEL} h-3.5 mb-2.5`} />
      <div className={`${SKEL} h-3.5 w-3/5 mb-2.5`} />
      <div className={`${SKEL} h-32 my-4`} />
      <div className={`${SKEL} h-3.5 mb-2.5`} />
      <div className={`${SKEL} h-32 my-4`} />
    </div>
  );
}
