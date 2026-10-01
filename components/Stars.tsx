export const Stars = ({ n }: { n: number }) => <div className="stars" aria-label={`${n} out of 5 stars`}>{"★".repeat(n)}</div>;
