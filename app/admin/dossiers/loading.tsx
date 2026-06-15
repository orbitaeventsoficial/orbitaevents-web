import './dossiers.css';

export default function DossiersLoading() {
  return (
    <div className="dg__skel dg__skel-pulse" aria-hidden="true">
      <div className="dg__skel-hero">
        <div className="dg__skel-bar dg__skel-bar--w-third" />
        <div className="dg__skel-bar dg__skel-bar--lg dg__skel-bar--w-half" />
        <div className="dg__skel-bar dg__skel-bar--w-two-thirds" />
      </div>
      <div className="dg__skel-panel">
        <div className="dg__skel-bar dg__skel-bar--w-third" />
        <div className="dg__skel-bar" />
        <div className="dg__skel-bar dg__skel-bar--w-two-thirds" />
      </div>
      <div className="dg__skel-grid">
        <div className="dg__skel-panel">
          <div className="dg__skel-bar dg__skel-bar--w-half" />
          <div className="dg__skel-bar" />
          <div className="dg__skel-bar dg__skel-bar--w-two-thirds" />
        </div>
        <div className="dg__skel-panel">
          <div className="dg__skel-bar dg__skel-bar--w-third" />
          <div className="dg__skel-bar" />
          <div className="dg__skel-bar" />
          <div className="dg__skel-bar dg__skel-bar--w-half" />
        </div>
      </div>
    </div>
  );
}
