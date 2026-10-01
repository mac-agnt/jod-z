// Klarna payment badge (pink pill with the Klarna mark), per Klarna's
// merchant badge style. Mark path from Simple Icons.
export function Klarna({ className = "" }: { className?: string }) {
  return (
    <span className={`klarna ${className}`} role="img" aria-label="Klarna">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.592 2v20H0V2h4.592zm11.46 0c0 4.194-1.583 8.105-4.415 11.068l-.278.283L17.702 22h-5.668l-6.893-9.4 1.779-1.332c2.858-2.14 4.535-5.378 4.637-8.924L11.562 2h4.49zM21.5 17a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
      </svg>
      <span>Klarna.</span>
    </span>
  );
}
