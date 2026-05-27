'use client';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="ax__error">
      <div className="ax__errorcard">
        <div className="ax__erroricon">
          <svg
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="ax__errortitle">
          Error al panell d&apos;administració
        </h2>

        <p className="ax__errortext">
          S&apos;ha produït un error inesperat.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="ax__errordebug">
            <p>
              {error.message}
            </p>
            {error.digest && (
              <p className="ax__errordigest">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="ax__erroractions">
          <button
            onClick={reset}
            type="button"
            className="ax__errorbtn ax__errorbtn--primary"
          >
            Torna-ho a provar
          </button>

          <a
            href="/admin"
            className="ax__errorbtn ax__errorbtn--ghost"
          >
            Tornar a l&apos;inici
          </a>
        </div>
      </div>
    </div>
  );
}
