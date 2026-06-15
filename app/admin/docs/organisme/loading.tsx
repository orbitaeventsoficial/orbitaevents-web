import '../docs-view.css';

export default function Loading() {
  return (
    <div className="dmd__skel" aria-busy="true" aria-label="Carregant atles…">
      <div className="dmd__skel-h" />
      <div className="dmd__skel-line" />
      <div className="dmd__skel-line dmd__skel-line--short" />
      <div className="dmd__skel-block" />
      <div className="dmd__skel-line" />
      <div className="dmd__skel-block" />
    </div>
  );
}
