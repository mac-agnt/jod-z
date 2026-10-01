import { Reveal } from "./Reveal";

const items = [
  { t: "Irish-owned brand", s: "Designed and tested by riders" },
  { t: "1 to 3 day DPD delivery", s: "Tracked, Ireland, UK and EU" },
  { t: "Easy size exchanges", s: "Wrong size? We swap it" },
  { t: "Pay in 3 with Klarna", s: "Interest free" },
];

export function TrustBar() {
  return (
    <section className="trust" aria-label="Why shop with us">
      <Reveal as="ul" className="wrap trust-inner" stagger={90}>
        {items.map((i) => (
          <li key={i.t}>
            <strong>{i.t}</strong>
            <span>{i.s}</span>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
