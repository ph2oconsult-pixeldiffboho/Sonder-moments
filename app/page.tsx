import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Pilot Programme · Anchor & Oak — The Father's Table",
  description:
    "A 90-day pilot of The Father's Table for Australian churches. Help the fathers in your congregation show up — with a 5-minute nightly Bible story programme for dads and young children. Book a free 15-minute call.",
  openGraph: {
    title: "Church Pilot Programme · Anchor & Oak",
    description:
      "Help the fathers in your church show up. A 90-day pilot programme for Australian churches — free, supported, and measurable.",
    url: "https://anchorandoak.com.au/church-pilot",
    siteName: "Anchor & Oak",
    locale: "en_AU",
    type: "website",
  },
};

const CALENDLY_URL = "https://calendly.com/YOUR_LINK_HERE";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="ao-label" aria-hidden="true">
      {children}
    </p>
  );
}

function GoldRule({ align = "center" }: { align?: "center" | "left" }) {
  return (
    <div
      className="ao-rule"
      style={{ marginLeft: align === "left" ? 0 : "auto" }}
      aria-hidden="true"
    />
  );
}

function BookCallButton({
  children,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
}) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`ao-btn ao-btn--${variant} ao-btn--${size}`}
    >
      {children}
    </a>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ChurchPilotPage() {
  return (
    <>
      {/* ── Fonts & Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --forest:        #1b3829;
          --forest-deep:   #122619;
          --forest-mid:    #264d38;
          --sage:          #3d6b4f;
          --parchment:     #faf6ef;
          --parchment-mid: #f3ece0;
          --parchment-dark:#e8dcc8;
          --gold:          #b8892a;
          --gold-bright:   #d4a94a;
          --gold-muted:    rgba(184,137,42,0.18);
          --ink:           #18120a;
          --ink-soft:      #3c2e1e;
          --muted:         #7a6e5e;
          --muted-light:   #a09080;
          --white:         #ffffff;
          --rule-dark:     rgba(184,137,42,0.22);
          --rule-light:    rgba(184,137,42,0.28);

          --font-display: 'Cormorant Garamond', Georgia, serif;
          --font-body:    'DM Sans', system-ui, sans-serif;

          --radius: 3px;
          --shadow: 0 4px 24px rgba(0,0,0,0.08);
          --shadow-lg: 0 12px 48px rgba(0,0,0,0.14);
        }

        html { scroll-behavior: smooth; font-size: 16px; }

        body {
          font-family: var(--font-body);
          color: var(--ink);
          background: var(--parchment);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
        }

        /* ── Utilities ── */
        .ao-label {
          font-family: var(--font-body);
          font-size: 0.685rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 0.75rem;
        }

        .ao-rule {
          width: 40px;
          height: 2px;
          background: var(--gold);
          margin-right: auto;
          margin-bottom: 1.5rem;
        }

        /* ── Buttons ── */
        .ao-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-family: var(--font-body);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-decoration: none;
          border-radius: var(--radius);
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .ao-btn--primary {
          background: var(--gold);
          color: var(--white);
          border: 2px solid var(--gold);
        }
        .ao-btn--primary:hover {
          background: var(--gold-bright);
          border-color: var(--gold-bright);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(184,137,42,0.35);
        }
        .ao-btn--ghost {
          background: transparent;
          color: var(--white);
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .ao-btn--ghost:hover {
          border-color: var(--gold);
          color: var(--gold);
        }
        .ao-btn--ghost-ink {
          background: transparent;
          color: var(--forest);
          border: 1.5px solid var(--forest);
        }
        .ao-btn--ghost-ink:hover {
          background: var(--forest);
          color: var(--white);
        }
        .ao-btn--md { font-size: 0.875rem; padding: 0.7rem 1.6rem; }
        .ao-btn--lg { font-size: 0.95rem; padding: 0.9rem 2.2rem; }

        /* ── Nav ── */
        .ao-nav {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 200;
          background: rgba(18, 38, 25, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(184,137,42,0.15);
        }
        .ao-nav__inner {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .ao-nav__logo {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--parchment);
          text-decoration: none;
          letter-spacing: 0.01em;
          flex-shrink: 0;
        }
        .ao-nav__logo em {
          font-style: normal;
          color: var(--gold);
        }
        .ao-nav__right {
          display: flex; align-items: center; gap: 1.5rem;
        }
        .ao-nav__link {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.15s;
        }
        .ao-nav__link:hover { color: var(--gold); }
        @media (max-width: 520px) { .ao-nav__link { display: none; } }

        /* ── Container ── */
        .ao-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .ao-container--narrow {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* ══ HERO ══ */
        .ao-hero {
          min-height: 100svh;
          background: var(--forest-deep);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8rem 0 5rem;
          position: relative;
          overflow: hidden;
        }

        /* Layered atmospheric background */
        .ao-hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 15% 60%, rgba(184,137,42,0.07) 0%, transparent 100%),
            radial-gradient(ellipse 50% 80% at 90% 10%, rgba(61,107,79,0.15) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Large decorative anchor watermark */
        .ao-hero__watermark {
          position: absolute;
          right: -4rem;
          bottom: -6rem;
          font-size: 32rem;
          line-height: 1;
          color: rgba(255,255,255,0.018);
          font-family: var(--font-display);
          pointer-events: none;
          user-select: none;
          font-weight: 700;
        }

        .ao-hero__content {
          position: relative;
          z-index: 1;
        }

        .ao-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 1.5rem;
        }
        .ao-hero__eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1.5px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .ao-hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2.8rem, 6.5vw, 5rem);
          font-weight: 700;
          line-height: 1.08;
          color: var(--white);
          margin-bottom: 1.75rem;
          max-width: 780px;
          letter-spacing: -0.01em;
        }
        .ao-hero h1 em {
          font-style: italic;
          color: var(--gold-bright);
        }

        .ao-hero__sub {
          font-size: clamp(1rem, 1.8vw, 1.125rem);
          line-height: 1.8;
          color: rgba(255,255,255,0.62);
          max-width: 520px;
          margin-bottom: 2.75rem;
          font-weight: 300;
        }

        .ao-hero__ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 0.875rem;
          margin-bottom: 4rem;
        }

        /* Social proof strip */
        .ao-hero__proof {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem 3rem;
          padding-top: 2.5rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .ao-hero__stat strong {
          display: block;
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--white);
          line-height: 1.1;
        }
        .ao-hero__stat span {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.42);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* ══ PROBLEM ══ */
        .ao-problem {
          padding: 6rem 0;
          background: var(--parchment);
        }
        .ao-problem__header {
          max-width: 580px;
          margin-bottom: 3.5rem;
        }
        .ao-problem h2 {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          font-weight: 700;
          line-height: 1.18;
          color: var(--ink);
          margin-bottom: 1.1rem;
        }
        .ao-problem__intro {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--muted);
          font-weight: 300;
        }

        .ao-problem__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 1.25rem;
        }
        .ao-problem__card {
          background: var(--white);
          border: 1px solid var(--parchment-dark);
          border-top: 3px solid var(--gold);
          padding: 1.75rem;
          border-radius: var(--radius);
          transition: box-shadow 0.2s;
        }
        .ao-problem__card:hover {
          box-shadow: var(--shadow);
        }
        .ao-problem__card h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 0.6rem;
          line-height: 1.3;
        }
        .ao-problem__card p {
          font-size: 0.88rem;
          line-height: 1.75;
          color: var(--muted);
          font-weight: 300;
        }

        /* ══ HOW IT WORKS ══ */
        .ao-how {
          padding: 6rem 0;
          background: var(--forest);
          position: relative;
          overflow: hidden;
        }
        .ao-how::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 50% at 50% 100%, rgba(184,137,42,0.06) 0%, transparent 100%);
          pointer-events: none;
        }
        .ao-how__header {
          text-align: center;
          margin-bottom: 4rem;
          position: relative;
        }
        .ao-how h2 {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          font-weight: 700;
          color: var(--white);
          line-height: 1.2;
          margin-bottom: 1rem;
        }
        .ao-how__sub {
          font-size: 1rem;
          color: rgba(255,255,255,0.55);
          max-width: 440px;
          margin: 0 auto;
          line-height: 1.75;
          font-weight: 300;
        }

        .ao-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          position: relative;
        }
        @media (max-width: 700px) {
          .ao-steps {
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem 1rem;
          }
        }
        @media (max-width: 420px) {
          .ao-steps { grid-template-columns: 1fr; }
        }

        /* Connector line between steps */
        .ao-steps::before {
          content: '';
          position: absolute;
          top: 2.1rem;
          left: calc(12.5% + 1.75rem);
          right: calc(12.5% + 1.75rem);
          height: 1px;
          background: linear-gradient(90deg, var(--rule-dark) 0%, var(--gold-bright) 50%, var(--rule-dark) 100%);
          pointer-events: none;
        }
        @media (max-width: 700px) { .ao-steps::before { display: none; } }

        .ao-step {
          padding: 0 1.25rem 1.5rem;
          text-align: center;
          position: relative;
        }
        .ao-step__num {
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          position: relative;
          z-index: 1;
        }
        .ao-step__num-text {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--gold);
          line-height: 1;
        }
        .ao-step h3 {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 0.6rem;
          line-height: 1.3;
        }
        .ao-step p {
          font-size: 0.86rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.52);
          font-weight: 300;
        }

        /* ══ WHY CHURCHES ══ */
        .ao-why {
          padding: 6rem 0;
          background: var(--parchment-mid);
        }
        .ao-why__header {
          margin-bottom: 3.5rem;
        }
        .ao-why h2 {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          font-weight: 700;
          color: var(--ink);
          line-height: 1.2;
          margin-bottom: 1rem;
          max-width: 560px;
        }
        .ao-why__intro {
          font-size: 1rem;
          color: var(--muted);
          max-width: 500px;
          line-height: 1.8;
          font-weight: 300;
        }

        .ao-benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 700px) {
          .ao-benefits { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 460px) {
          .ao-benefits { grid-template-columns: 1fr; }
        }

        .ao-benefit {
          background: var(--white);
          border: 1px solid var(--parchment-dark);
          border-radius: var(--radius);
          padding: 1.5rem;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .ao-benefit:hover {
          box-shadow: var(--shadow);
          transform: translateY(-2px);
        }
        .ao-benefit__icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: var(--gold-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        .ao-benefit h3 {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 0.4rem;
          line-height: 1.3;
        }
        .ao-benefit p {
          font-size: 0.84rem;
          line-height: 1.7;
          color: var(--muted);
          font-weight: 300;
        }

        /* ══ PILOT ══ */
        .ao-pilot {
          padding: 6rem 0;
          background: var(--parchment);
        }
        .ao-pilot h2 {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          font-weight: 700;
          color: var(--ink);
          line-height: 1.2;
          margin-bottom: 1rem;
        }
        .ao-pilot__intro {
          font-size: 1rem;
          color: var(--muted);
          max-width: 520px;
          line-height: 1.8;
          font-weight: 300;
          margin-bottom: 2.5rem;
        }

        .ao-pilot__box {
          background: var(--forest-deep);
          border-radius: var(--radius);
          padding: clamp(2rem, 5vw, 3.5rem);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(184,137,42,0.2);
        }

        /* Giant "90" watermark */
        .ao-pilot__box::after {
          content: '90';
          position: absolute;
          font-family: var(--font-display);
          font-size: 22rem;
          font-weight: 700;
          color: rgba(255,255,255,0.025);
          right: -2rem;
          bottom: -4rem;
          line-height: 1;
          pointer-events: none;
        }

        .ao-pilot__box-label {
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 1.75rem;
        }

        .ao-pilot__items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1.75rem;
          margin-bottom: 2.5rem;
          position: relative;
          z-index: 1;
        }
        .ao-pilot__item {
          padding-left: 1rem;
          border-left: 2px solid var(--gold);
        }
        .ao-pilot__item h4 {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 0.35rem;
          line-height: 1.3;
        }
        .ao-pilot__item p {
          font-size: 0.82rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.48);
          font-weight: 300;
        }

        .ao-pilot__footer {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 2rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2rem;
          position: relative;
          z-index: 1;
        }
        .ao-pilot__price {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 700;
          color: var(--white);
          line-height: 1;
        }
        .ao-pilot__price-note {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.38);
          font-style: italic;
          max-width: 280px;
          line-height: 1.6;
          margin-top: 0.25rem;
        }

        /* ══ FOUNDER ══ */
        .ao-founder {
          padding: 6rem 0;
          background: var(--parchment-mid);
        }
        .ao-founder__wrap {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 2.5rem;
          align-items: start;
          max-width: 680px;
        }
        @media (max-width: 560px) {
          .ao-founder__wrap { grid-template-columns: 1fr; gap: 1.5rem; }
        }
        .ao-founder__avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--forest-mid);
          border: 2.5px solid var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--gold);
          flex-shrink: 0;
        }
        .ao-founder blockquote {
          font-family: var(--font-display);
          font-style: italic;
          font-size: clamp(1.05rem, 1.8vw, 1.25rem);
          line-height: 1.8;
          color: var(--ink);
          border-left: 3px solid var(--gold);
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .ao-founder__sig strong {
          display: block;
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--ink);
        }
        .ao-founder__sig span {
          font-size: 0.8rem;
          color: var(--muted);
        }

        /* ══ FAQ ══ */
        .ao-faq {
          padding: 6rem 0;
          background: var(--parchment);
        }
        .ao-faq__header {
          max-width: 480px;
          margin-bottom: 3rem;
        }
        .ao-faq h2 {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.6rem);
          font-weight: 700;
          color: var(--ink);
          line-height: 1.2;
        }

        .ao-faq__list { max-width: 680px; }

        .ao-faq__item {
          border-bottom: 1px solid var(--parchment-dark);
        }
        .ao-faq__item:first-child {
          border-top: 1px solid var(--parchment-dark);
        }
        .ao-faq__item details { padding: 1.5rem 0; }
        .ao-faq__item details summary {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          line-height: 1.4;
        }
        .ao-faq__item details summary::-webkit-details-marker { display: none; }
        .ao-faq__item details summary::after {
          content: '+';
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--gold);
          flex-shrink: 0;
          line-height: 1.2;
          font-family: var(--font-body);
          margin-top: -0.1rem;
        }
        .ao-faq__item details[open] summary::after { content: '−'; }
        .ao-faq__item details p {
          font-size: 0.92rem;
          line-height: 1.85;
          color: var(--muted);
          margin-top: 1rem;
          padding-right: 2.5rem;
          font-weight: 300;
        }

        /* ══ FINAL CTA ══ */
        .ao-cta {
          padding: 7rem 0;
          background: var(--forest-deep);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .ao-cta::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 120%, rgba(184,137,42,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .ao-cta__inner { position: relative; z-index: 1; }
        .ao-cta h2 {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 5vw, 3.6rem);
          font-weight: 700;
          color: var(--white);
          line-height: 1.15;
          margin-bottom: 1.25rem;
        }
        .ao-cta h2 em {
          font-style: italic;
          color: var(--gold-bright);
        }
        .ao-cta__sub {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.52);
          max-width: 420px;
          margin: 0 auto 2.75rem;
          line-height: 1.8;
          font-weight: 300;
        }
        .ao-cta__footnote {
          margin-top: 1.25rem;
          font-size: 0.76rem;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ══ FOOTER ══ */
        .ao-footer {
          background: #0d1f14;
          padding: 2.5rem 0;
        }
        .ao-footer__inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .ao-footer__brand {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
        }
        .ao-footer__brand em {
          font-style: normal;
          color: rgba(184,137,42,0.6);
        }
        .ao-footer__links {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .ao-footer__links a {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.28);
          text-decoration: none;
          transition: color 0.15s;
        }
        .ao-footer__links a:hover { color: var(--gold); }
        .ao-footer__copy {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.2);
          width: 100%;
          margin-top: 0.5rem;
        }

        /* ── Page-load fade-up animation ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ao-hero__eyebrow { animation: fadeUp 0.6s ease both; animation-delay: 0.1s; }
        .ao-hero h1       { animation: fadeUp 0.7s ease both; animation-delay: 0.25s; }
        .ao-hero__sub     { animation: fadeUp 0.7s ease both; animation-delay: 0.4s; }
        .ao-hero__ctas    { animation: fadeUp 0.7s ease both; animation-delay: 0.52s; }
        .ao-hero__proof   { animation: fadeUp 0.6s ease both; animation-delay: 0.65s; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .ao-hero { padding: 6.5rem 0 4rem; }
          .ao-problem, .ao-how, .ao-why, .ao-pilot, .ao-founder, .ao-faq, .ao-cta {
            padding: 4rem 0;
          }
        }
      `}</style>

      {/* ════ NAV ════ */}
      <nav className="ao-nav" aria-label="Main navigation">
        <div className="ao-nav__inner">
          <a href="https://thefatherstable.anchorandoak.com.au" className="ao-nav__logo">
            Anchor <em>&</em> Oak
          </a>
          <div className="ao-nav__right">
            <a href="#pilot" className="ao-nav__link">Pilot Details</a>
            <a href="#faq" className="ao-nav__link">FAQ</a>
            <BookCallButton variant="primary" size="md">Book a Call</BookCallButton>
          </div>
        </div>
      </nav>

      <main>

        {/* ════ HERO ════ */}
        <section className="ao-hero" aria-labelledby="hero-h1">
          <div aria-hidden="true" className="ao-hero__watermark">⚓</div>
          <div className="ao-container ao-hero__content">
            <p className="ao-hero__eyebrow">
              Church Pilot Programme · Australia 2026
            </p>
            <h1 id="hero-h1">
              Help the fathers<br />
              in your church<br />
              <em>actually show up.</em>
            </h1>
            <p className="ao-hero__sub">
              The Father&rsquo;s Table is a 5-minute nightly Bible story
              programme for dads and their young children. No preparation.
              No guilt. Just a father, a child, and God&rsquo;s Word — every evening.
            </p>
            <div className="ao-hero__ctas">
              <BookCallButton variant="primary" size="lg">
                Book a Free 15-Minute Call →
              </BookCallButton>
              <a href="#pilot" className="ao-btn ao-btn--ghost ao-btn--lg">
                See Pilot Details
              </a>
            </div>
            <div className="ao-hero__proof" role="list">
              {[
                { stat: "1,200+", label: "Families using it weekly" },
                { stat: "34",     label: "Countries represented" },
                { stat: "5 min",  label: "Average session length" },
                { stat: "90 days",label: "Pilot with full support" },
              ].map(({ stat, label }) => (
                <div key={label} className="ao-hero__stat" role="listitem">
                  <strong>{stat}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ PROBLEM ════ */}
        <section className="ao-problem" aria-labelledby="problem-h2">
          <div className="ao-container">
            <div className="ao-problem__header">
              <SectionLabel>The Reality</SectionLabel>
              <GoldRule align="left" />
              <h2 id="problem-h2">
                Most dads want to lead<br />spiritually. Most don&rsquo;t know<br />
                where to start.
              </h2>
              <p className="ao-problem__intro">
                You see it every week — engaged men at church who go home
                and feel lost when it comes to leading their family in faith.
                Not from lack of love. From lack of a simple, reliable
                starting point.
              </p>
            </div>
            <div className="ao-problem__grid">
              {[
                {
                  title: "No time to prepare",
                  body: "After work, dinner, and bedtime, elaborate devotional content never happens. Dads need something that works in the margins of a real day.",
                },
                {
                  title: "The guilt cycle",
                  body: "Resources that demand too much create shame when life interrupts. That shame makes it harder to try again. The bar has to be low enough to actually clear.",
                },
                {
                  title: "Kids are only young once",
                  body: "The window for forming faith habits in young children (ages 4–7) is narrow and irreplaceable. Waiting for the right time is its own decision.",
                },
                {
                  title: "Sunday isn't enough",
                  body: "Sunday morning is vital — but it's 1% of a child's week. The other 99% happens at home. Fathers are the missing link between church and family faith.",
                },
              ].map(({ title, body }) => (
                <article key={title} className="ao-problem__card">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ════ HOW IT WORKS ════ */}
        <section className="ao-how" aria-labelledby="how-h2">
          <div className="ao-container">
            <div className="ao-how__header">
              <SectionLabel>How It Works</SectionLabel>
              <GoldRule />
              <h2 id="how-h2">Four steps. Five minutes. Every night.</h2>
              <p className="ao-how__sub">
                Designed to fit between dinner and bedtime — with zero
                preparation required from Dad.
              </p>
            </div>
            <ol className="ao-steps" aria-label="How The Father's Table works">
              {[
                {
                  n: "1",
                  title: "Open a story",
                  body: "Dad picks a Bible story from the library. 46 stories across 12 months, organised by theme. Works on any phone or tablet, online or off.",
                },
                {
                  n: "2",
                  title: "Read or listen",
                  body: "Read together aloud, or tap Listen and let the narration carry the story. Written for ages 4–7 — warm, simple, and true to the text.",
                },
                {
                  n: "3",
                  title: "Talk together",
                  body: "Three discussion questions follow — already written for him. Dad doesn't need to think. He just asks and listens to his child.",
                },
                {
                  n: "4",
                  title: "Close in prayer",
                  body: "A short prayer written for him to read aloud. His child hears Dad speak to God — and that moment is the most formative thing.",
                },
              ].map(({ n, title, body }) => (
                <li key={n} className="ao-step">
                  <div className="ao-step__num" aria-hidden="true">
                    <span className="ao-step__num-text">{n}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ════ WHY CHURCHES ════ */}
        <section className="ao-why" aria-labelledby="why-h2">
          <div className="ao-container">
            <div className="ao-why__header">
              <SectionLabel>Why It Works for Churches</SectionLabel>
              <GoldRule align="left" />
              <h2 id="why-h2">
                A tool your men&rsquo;s and family<br />
                ministries can rely on.
              </h2>
              <p className="ao-why__intro">
                The Father&rsquo;s Table was built with church deployment in mind
                — not just individual households.
              </p>
            </div>
            <div className="ao-benefits">
              {[
                {
                  icon: "📵",
                  title: "Works offline",
                  body: "Installs as a PWA with no app store required. Families use it even when camping or without signal. Zero friction to get started.",
                },
                {
                  icon: "✝️",
                  title: "Theologically sound",
                  body: "Grounded in Scripture, non-denominational, faithful to the text. No social features, no ads, and no data collected from children.",
                },
                {
                  icon: "📅",
                  title: "12-month curriculum",
                  body: "A structured journey through the Old and New Testaments — giving dads a clear path forward, not just isolated stories.",
                },
                {
                  icon: "🖨",
                  title: "Printable workbooks",
                  body: "Table Talk cards, word searches, reflection journals, and verse cards for every story. Print for Sunday, use at home all week.",
                },
                {
                  icon: "📊",
                  title: "Measurable engagement",
                  body: "Anonymised usage reports for your pilot cohort — real data you can share with your Elder board or leadership team.",
                },
                {
                  icon: "🛡️",
                  title: "Safe to recommend",
                  body: "No advertising. No algorithm. No third-party data sharing. A resource you can hand to any family with full confidence.",
                },
              ].map(({ icon, title, body }) => (
                <article key={title} className="ao-benefit">
                  <div className="ao-benefit__icon" aria-hidden="true">{icon}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ════ PILOT ════ */}
        <section className="ao-pilot" id="pilot" aria-labelledby="pilot-h2">
          <div className="ao-container">
            <SectionLabel>The Offer</SectionLabel>
            <GoldRule align="left" />
            <h2 id="pilot-h2">The 90-Day Church Pilot</h2>
            <p className="ao-pilot__intro">
              We partner with a small number of Australian churches each quarter
              for a supported pilot — giving your families full access and giving
              us the real-world feedback that shapes how the product grows.
            </p>
            <div className="ao-pilot__box">
              <p className="ao-pilot__box-label">What&rsquo;s included</p>
              <div className="ao-pilot__items">
                {[
                  {
                    title: "Full access for up to 25 families",
                    body: "All 46 stories, printable workbooks, Read Aloud narration and the 12-month curriculum — for every enrolled family, for 90 days.",
                  },
                  {
                    title: "Onboarding call with your team",
                    body: "A 30-minute walkthrough so your staff can confidently introduce The Father's Table to fathers at your next men's event.",
                  },
                  {
                    title: "Printable launch materials",
                    body: "A bulletin insert and simple one-page explainer written for dads — not church staff. Ready to hand out on Sunday morning.",
                  },
                  {
                    title: "Mid-pilot check-in",
                    body: "A brief 15-minute call at 45 days to see how it's landing and answer any questions from your pastoral team.",
                  },
                  {
                    title: "Engagement summary report",
                    body: "An anonymised usage report at 90 days — session counts, streaks, and story completion data — ready to share with your leadership.",
                  },
                  {
                    title: "Church licensing pathway",
                    body: "First option to continue at a subsidised church rate. Tiered pricing by congregation size — discussed at the 90-day debrief.",
                  },
                ].map(({ title, body }) => (
                  <div key={title} className="ao-pilot__item">
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
              <div className="ao-pilot__footer">
                <div>
                  <div className="ao-pilot__price">$0</div>
                  <p className="ao-pilot__price-note">
                    for the 90-day pilot period. We&rsquo;re accepting a limited
                    number of churches for the Q2 2026 cohort.
                  </p>
                </div>
                <BookCallButton variant="primary" size="lg">
                  Book a 15-Minute Call →
                </BookCallButton>
              </div>
            </div>
          </div>
        </section>

        {/* ════ FOUNDER NOTE ════ */}
        <section className="ao-founder" aria-labelledby="founder-h2">
          <div className="ao-container">
            <SectionLabel>From the Founder</SectionLabel>
            <GoldRule align="left" />
            <h2 id="founder-h2" style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, marginBottom: "2rem", color: "var(--ink)" }}>
              Why I built this
            </h2>
            <div className="ao-founder__wrap">
              <div className="ao-founder__avatar" aria-hidden="true">A</div>
              <div>
                <blockquote>
                  &ldquo;I kept hearing the same thing from dads at church —
                  they wanted to lead their family in faith but had no idea
                  where to start. Not because they didn&rsquo;t care. Because
                  nobody had given them something simple enough to actually do
                  on a Tuesday night after a long day of work.
                  <br /><br />
                  The Father&rsquo;s Table is my attempt to close that gap. Five
                  minutes. A story. A conversation. A prayer. That&rsquo;s all it
                  is. And over ninety days, it adds up to something that
                  genuinely matters.&rdquo;
                </blockquote>
                <div className="ao-founder__sig">
                  <strong>Anchor &amp; Oak</strong>
                  <span>Victoria, Australia · anchorandoak.com.au</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ FAQ ════ */}
        <section className="ao-faq" id="faq" aria-labelledby="faq-h2">
          <div className="ao-container">
            <div className="ao-faq__header">
              <SectionLabel>Common Questions</SectionLabel>
              <GoldRule align="left" />
              <h2 id="faq-h2">
                Everything you&rsquo;d<br />want to know
              </h2>
            </div>
            <div className="ao-faq__list">
              {[
                {
                  q: "What age group is The Father's Table designed for?",
                  a: "Every story is written for children aged 4–7. The language is simple, warm, and wonder-filled — designed for little ears and big imaginations. Older siblings (up to age 10) often enjoy joining in, and families consistently tell us they didn't expect it to work as well as it does with mixed-age children.",
                },
                {
                  q: "Does it require any app download or account setup from families?",
                  a: "No app download is required. Families visit the web link on any smartphone, tablet, or computer. They can optionally install it as a home screen app (PWA) in one tap — which also enables full offline access. Free stories require no account at all. Full access setup takes under two minutes.",
                },
                {
                  q: "Is it theologically safe to recommend to all our families?",
                  a: "Yes. The content is non-denominational, Scripture-grounded, and reviewed for theological faithfulness. It is not affiliated with any specific tradition or denomination. Bible quotations draw from the ESV. There is no advertising, no social features, and no data collected from children.",
                },
                {
                  q: "How do we introduce it to the fathers in our church?",
                  a: "We provide a printable bulletin insert and a one-page explainer written directly for dads — not church staff. The simplest approach is to hand it out at a men's breakfast or family ministry event and say: 'Try it tonight.' We'll walk your team through everything on the onboarding call.",
                },
                {
                  q: "What happens after the 90-day pilot ends?",
                  a: "At 90 days we hold a debrief call to review the engagement data and hear your team's feedback honestly. If it's a good fit, we discuss a church licensing arrangement with subsidised rates based on your congregation size. There is no automatic continuation and no pressure — the conversation happens on your terms.",
                },
                {
                  q: "How many churches are you accepting for the Q2 2026 pilot?",
                  a: "We are deliberately keeping this small — a maximum of six churches for the Q2 cohort. This lets us give each church the attention the pilot deserves and ensure the feedback we receive is meaningful, not just a number. If you're considering it, the best thing to do is book a call soon.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="ao-faq__item">
                  <details>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ FINAL CTA ════ */}
        <section className="ao-cta" aria-labelledby="cta-h2">
          <div className="ao-container ao-cta__inner">
            <SectionLabel>Ready to explore it?</SectionLabel>
            <h2 id="cta-h2">
              Let&rsquo;s talk<br /><em>for 15 minutes.</em>
            </h2>
            <p className="ao-cta__sub">
              No pitch deck. No pressure. Just a conversation about whether
              The Father&rsquo;s Table is a good fit for your church and the
              families you serve.
            </p>
            <BookCallButton variant="primary" size="lg">
              Book a Free Call with the Founder →
            </BookCallButton>
            <p className="ao-cta__footnote">
              15 minutes &nbsp;·&nbsp; No obligation &nbsp;·&nbsp; Australian-based
            </p>
          </div>
        </section>

      </main>

      {/* ════ FOOTER ════ */}
      <footer className="ao-footer">
        <div className="ao-container">
          <div className="ao-footer__inner">
            <div className="ao-footer__brand">
              Anchor <em>&</em> Oak &mdash; Victoria, Australia
            </div>
            <nav className="ao-footer__links" aria-label="Footer navigation">
              <a href="https://thefatherstable.anchorandoak.com.au">
                The Father&rsquo;s Table App
              </a>
              <a href="mailto:hello@anchorandoak.com.au">
                hello@anchorandoak.com.au
              </a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
            </nav>
            <p className="ao-footer__copy">
              © 2026 Anchor &amp; Oak. All rights reserved. ABN: [YOUR ABN]
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
