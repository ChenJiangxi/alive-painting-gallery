import { useRef, useState } from 'react';
import { works, safeSrc, type Work } from './data/works';

const HINT_TEXT = 'hover · 让画呼吸';

export default function App() {
  return (
    <div className="min-h-screen">
      <TopStrip />
      <Cover />
      <CuratorNote />
      <WorksList />
      <Colophon />
    </div>
  );
}

/* ─── top strip — barely there site identity ─── */
function TopStrip() {
  return (
    <header className="px-8 pt-6 pb-4 flex items-center justify-between text-[10px] tracking-[0.32em] uppercase text-[var(--color-ink-mute)]">
      <span className="font-[family-name:var(--font-mono)]">alive painting gallery</span>
      <span className="font-[family-name:var(--font-mono)]">show 01 · open</span>
    </header>
  );
}

/* ─── cover — exhibition title, full viewport feel ─── */
function Cover() {
  return (
    <section className="px-8 min-h-[80vh] flex flex-col justify-center items-center text-center">
      <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--color-ink-mute)] mb-8">
        current exhibition
      </div>
      <h1
        className="font-[family-name:var(--font-display)] text-[var(--color-ink)] leading-[1.05] tracking-tight"
        style={{ fontSize: 'clamp(48px, 9vw, 128px)' }}
      >
        Picasso,
        <br />
        Once More Breathing.
      </h1>
      <div className="mt-10 font-[family-name:var(--font-zh)] text-[15px] text-[var(--color-ink-soft)] tracking-wider">
        毕加索，重新呼吸
      </div>
      <div className="mt-16 text-[10px] tracking-[0.3em] uppercase text-[var(--color-ink-faint)]">
        a small intervention by jessy · 2026
      </div>
    </section>
  );
}

/* ─── curator's note — narrow column, body serif ─── */
function CuratorNote() {
  return (
    <section className="px-6 py-32 flex justify-center">
      <div className="max-w-[640px] w-full">
        <div className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-ink-mute)] mb-8">
          curator's note
        </div>
        <div className="space-y-6 font-[family-name:var(--font-zh)] text-[16px] leading-[1.85] text-[var(--color-ink-soft)]">
          {/* Placeholder — Jessy to replace. Kept obviously-draft so it doesn't ship as voice. */}
          <p>
            <span className="text-[var(--color-ink-faint)]">
              [策展人短文 · 待 Jessy 写]
            </span>
          </p>
          <p>
            <span className="text-[var(--color-ink-faint)]">
              先放一段占位文字。可写：为什么选毕加索？让画动起来这件事对你意味着什么？
              你希望观众怎么走过这间小展厅？两三段，不用长。
            </span>
          </p>
        </div>
        <div className="mt-10 h-px w-16 bg-[var(--color-rule)]" />
      </div>
    </section>
  );
}

/* ─── works list — generous vertical rhythm ─── */
function WorksList() {
  // Show motion works first (the climax/the point of the show), then statics.
  const motionFirst = [...works].sort((a, b) => {
    const am = a.motionSrcs.length > 0 ? 0 : 1;
    const bm = b.motionSrcs.length > 0 ? 0 : 1;
    return am - bm;
  });

  return (
    <main className="px-6">
      {motionFirst.map((w, i) => (
        <WorkRow key={w.id} work={w} index={i} />
      ))}
    </main>
  );
}

function WorkRow({ work, index }: { work: Work; index: number }) {
  const hasMotion = work.motionSrcs.length > 0;
  return (
    <article
      className={
        'max-w-[960px] mx-auto ' +
        (index === 0 ? 'pt-20 pb-32' : 'py-32') +
        ' border-t border-[var(--color-rule)]'
      }
    >
      <WorkNumber index={index} hasMotion={hasMotion} />
      {hasMotion ? <HoverAlive work={work} /> : <SoloPiece work={work} />}
      <WorkLabel work={work} />
    </article>
  );
}

/* small "no. 03" marker — gives the museum-walk sense of sequence */
function WorkNumber({ index, hasMotion }: { index: number; hasMotion: boolean }) {
  const n = String(index + 1).padStart(2, '0');
  return (
    <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--color-ink-faint)] mb-10 font-[family-name:var(--font-mono)] flex items-baseline gap-4">
      <span>no. {n}</span>
      {hasMotion && (
        <span className="text-[var(--color-ink-mute)]/70">— {HINT_TEXT}</span>
      )}
    </div>
  );
}

/* HoverAlive — single frame; static painting that fades into video on hover.
   Mobile (no hover): tap to toggle. The painting itself is the trigger area. */
function HoverAlive({ work }: { work: Work }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [alive, setAlive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Pause + reset to first frame when leaving (so it always "starts breathing"
  // from the painting state, never from mid-motion).
  const wake = () => {
    const v = ref.current;
    if (!v) return;
    setAlive(true);
    try {
      v.currentTime = 0;
      v.play();
    } catch {
      /* autoplay may be blocked on first interaction; fine — controls take over */
    }
  };
  const rest = () => {
    const v = ref.current;
    setAlive(false);
    if (!v) return;
    v.pause();
    try {
      v.currentTime = 0;
    } catch {
      /* ignore */
    }
  };
  // Mobile / touch: tap toggles.
  const toggle = () => {
    if (alive) rest();
    else wake();
  };

  return (
    <div
      className="relative w-full mx-auto"
      onMouseEnter={wake}
      onMouseLeave={rest}
      onTouchStart={(e) => {
        e.preventDefault();
        toggle();
      }}
    >
      <div className="relative w-full bg-[var(--color-paper-deep)]/30 overflow-hidden cursor-pointer">
        {/* Static — base layer, always present. Defines the aspect ratio. */}
        <img
          src={safeSrc(work.staticSrc)}
          alt={work.title}
          className={
            'block w-full h-auto transition-opacity duration-500 ease-out ' +
            (alive && loaded ? 'opacity-0' : 'opacity-100')
          }
          loading="lazy"
        />
        {/* Motion — absolutely positioned over the static, fades in when alive. */}
        <video
          ref={ref}
          src={safeSrc(work.motionSrcs[0])}
          poster={safeSrc(work.staticSrc)}
          preload="metadata"
          muted
          loop
          playsInline
          onLoadedData={() => setLoaded(true)}
          className={
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out pointer-events-none ' +
            (alive && loaded ? 'opacity-100' : 'opacity-0')
          }
        />
        {/* Quiet "breathe" indicator — disappears on hover */}
        <div
          className={
            'absolute bottom-3 right-3 text-[9px] tracking-[0.3em] uppercase text-[var(--color-paper)] mix-blend-difference font-[family-name:var(--font-mono)] pointer-events-none transition-opacity duration-300 ' +
            (alive ? 'opacity-0' : 'opacity-60')
          }
        >
          breathe
        </div>
      </div>
    </div>
  );
}

/* solo — single image, large, centered. No frame, no label strip; the painting
   stands by itself like a wall-mounted work. */
function SoloPiece({ work }: { work: Work }) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[820px] w-full">
        <div className="bg-[var(--color-paper-deep)]/30">
          <img
            src={safeSrc(work.staticSrc)}
            alt={work.title}
            className="w-full h-auto block"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

/* museum-style label strip — title / artist / year / intervention note */
function WorkLabel({ work }: { work: Work }) {
  return (
    <div className="mt-8 flex flex-col items-start gap-1.5 max-w-[640px]">
      <div className="font-[family-name:var(--font-display)] text-[26px] leading-[1.15] text-[var(--color-ink)]">
        {work.titleEn ?? work.title}
        {work.year && (
          <span className="text-[var(--color-ink-mute)]">, {work.year}</span>
        )}
      </div>
      <div className="font-[family-name:var(--font-zh)] text-[13px] text-[var(--color-ink-mute)] tracking-wide">
        《{work.title}》 · Pablo Picasso
      </div>
      {work.note && (
        <div className="mt-3 font-[family-name:var(--font-zh)] text-[13px] text-[var(--color-ink-soft)] leading-relaxed border-l border-[var(--color-rule)] pl-3">
          {work.note}
        </div>
      )}
      {work.motionSrcs.length > 0 && (
        <div className="mt-3 text-[9px] tracking-[0.35em] uppercase text-[var(--color-ink-faint)] font-[family-name:var(--font-mono)]">
          intervention by jessy · 2026
        </div>
      )}
    </div>
  );
}

/* ─── colophon — quiet footer, back to home ─── */
function Colophon() {
  return (
    <footer className="px-8 py-24 border-t border-[var(--color-rule)] mt-10">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row gap-6 sm:items-end sm:justify-between">
        <div>
          <div className="font-[family-name:var(--font-display)] text-[28px] text-[var(--color-ink)] leading-tight">
            Alive Painting Gallery
          </div>
          <div className="mt-1 text-[10px] tracking-[0.3em] uppercase text-[var(--color-ink-mute)] font-[family-name:var(--font-mono)]">
            a small room · curated by jessy
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <a
            href="https://jessylab.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] tracking-[0.25em] uppercase text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] font-[family-name:var(--font-mono)]"
          >
            ← jessylab.cc
          </a>
          <div className="text-[10px] text-[var(--color-ink-faint)] font-[family-name:var(--font-mono)]">
            © {new Date().getFullYear()} — paintings by Pablo Picasso; intervention by Jessy.
          </div>
        </div>
      </div>
    </footer>
  );
}
