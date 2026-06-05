import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Hall } from './scene/Hall';
import { CameraRig } from './scene/CameraRig';
import { works } from './data/works';

export default function App() {
  const [hoveredIndex, setHovered] = useState<number | null>(null);
  const [focusedIndex, setFocused] = useState<number | null>(null);
  const [showCuratorNote, setShowCurator] = useState(false);

  const selectWork = useCallback((i: number) => setFocused(i), []);
  const exitFocus = useCallback(() => setFocused(null), []);

  // ESC backs out
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCuratorNote) setShowCurator(false);
        else if (focusedIndex != null) exitFocus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedIndex, exitFocus, showCuratorNote]);

  const focused = focusedIndex != null ? works[focusedIndex] : null;

  return (
    <div className="fixed inset-0 bg-[#1a1714]">
      {/* the 3D hall fills the viewport */}
      <Canvas
        camera={{ fov: 55, near: 0.05, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        // click on empty Canvas background = back to entrance
        onPointerMissed={() => {
          if (focusedIndex != null) exitFocus();
        }}
      >
        <color attach="background" args={['#0e0c0a']} />
        <fog attach="fog" args={['#0e0c0a', 14, 28]} />
        <CameraRig focusedIndex={focusedIndex} />
        <Hall
          hoveredIndex={hoveredIndex}
          setHovered={setHovered}
          onSelect={selectWork}
        />
      </Canvas>

      {/* HUD: top strip — site identity, exit hint */}
      <header className="pointer-events-none absolute top-0 left-0 right-0 px-6 pt-5 flex items-center justify-between text-[10px] tracking-[0.32em] uppercase font-[family-name:var(--font-mono)] text-[var(--color-paper)]/70 z-10">
        <div className="flex items-baseline gap-4">
          <span>alive painting gallery</span>
          <span className="text-[var(--color-paper)]/40">· show 01</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCurator(true)}
          className="pointer-events-auto text-[var(--color-paper)]/70 hover:text-[var(--color-paper)] tracking-[0.32em]"
        >
          curator's note
        </button>
      </header>

      {/* HUD: bottom hint — only visible at entrance */}
      {focusedIndex == null && (
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 text-center text-[10px] tracking-[0.4em] uppercase font-[family-name:var(--font-mono)] text-[var(--color-paper)]/50 z-10">
          {hoveredIndex == null
            ? 'move · hover a painting · 让它呼吸'
            : 'click · 走近看'}
        </div>
      )}

      {/* caption — slides up from below when a painting is focused */}
      <CaptionPanel work={focused} onClose={exitFocus} />

      {/* curator's note — overlay sheet */}
      {showCuratorNote && (
        <CuratorOverlay onClose={() => setShowCurator(false)} />
      )}

      {/* loading veil — first frame can flash while textures load */}
      <FirstFrameVeil />
    </div>
  );
}

/* ─── caption panel ─── */
function CaptionPanel({
  work,
  onClose,
}: {
  work: ReturnType<typeof works.find> | null;
  onClose: () => void;
}) {
  const open = !!work;
  return (
    <div
      className={
        'absolute left-0 right-0 bottom-0 px-6 pb-8 pt-6 z-20 transition-transform duration-500 ease-out ' +
        (open ? 'translate-y-0' : 'translate-y-full')
      }
    >
      <div className="max-w-[820px] mx-auto bg-[var(--color-paper)]/95 backdrop-blur-md border border-[var(--color-rule)] px-6 py-5 flex items-end justify-between gap-6 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.55)]">
        {work && (
          <>
            <div className="min-w-0">
              <div className="font-[family-name:var(--font-display)] text-[26px] leading-[1.1] text-[var(--color-ink)]">
                {work.titleEn ?? work.title}
                {work.year && (
                  <span className="text-[var(--color-ink-mute)]">, {work.year}</span>
                )}
              </div>
              <div className="font-[family-name:var(--font-zh)] text-[13px] text-[var(--color-ink-mute)] tracking-wide mt-1">
                《{work.title}》 · Pablo Picasso
              </div>
              {work.note && (
                <div className="mt-3 font-[family-name:var(--font-zh)] text-[13px] text-[var(--color-ink-soft)] leading-relaxed border-l border-[var(--color-rule)] pl-3 max-w-[460px]">
                  {work.note}
                </div>
              )}
              {work.motionSrcs.length > 0 && (
                <div className="mt-3 text-[9px] tracking-[0.35em] uppercase text-[var(--color-ink-faint)] font-[family-name:var(--font-mono)]">
                  intervention by jessy · 2026
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.35em] uppercase text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] border border-[var(--color-rule)] px-3 py-1.5"
              title="esc — back to hall"
            >
              ← back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── curator's note overlay ─── */
function CuratorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-30 bg-[#0e0c0a]/85 backdrop-blur-md flex items-center justify-center px-6 py-12"
      onClick={onClose}
    >
      <div
        className="max-w-[640px] w-full bg-[var(--color-paper)] border border-[var(--color-rule)] p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-ink-mute)] font-[family-name:var(--font-mono)]">
            curator's note
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.35em] uppercase text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
          >
            esc
          </button>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-[40px] leading-[1.05] text-[var(--color-ink)] mb-6">
          Picasso, Once More Breathing.
        </h2>
        <div className="space-y-5 font-[family-name:var(--font-zh)] text-[15px] leading-[1.85] text-[var(--color-ink-soft)]">
          <p>
            <span className="text-[var(--color-ink-faint)]">
              [策展人短文 · 待 Jessy 写]
            </span>
          </p>
          <p>
            <span className="text-[var(--color-ink-faint)]">
              先放一段占位。你可以写：为什么是毕加索？让画动起来这件事意味着什么？
              你希望走进这间小展厅的人，离开时记住什么？两三段，不用长。
            </span>
          </p>
        </div>
        <div className="mt-10 text-[10px] tracking-[0.3em] uppercase text-[var(--color-ink-faint)] font-[family-name:var(--font-mono)]">
          — jessy, 2026
        </div>
      </div>
    </div>
  );
}

/* ─── First-frame veil: fades out once the canvas is mounted ─── */
function FirstFrameVeil() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setHidden(true), 800);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      className={
        'pointer-events-none absolute inset-0 z-40 bg-[#0e0c0a] transition-opacity duration-700 ' +
        (hidden ? 'opacity-0' : 'opacity-100')
      }
      aria-hidden
    />
  );
}
