/**
 * Clean Background Component
 * - Background glowing / ambient orbs removed
 * - Background photos removed
 * - Clean, sleek dark background
 */

export default function AnimatedBackground({
  showGrid = true,
  className = '',
}) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#06080E] ${className}`}
      aria-hidden="true"
    >
      {/* ── Subtle Tech Grid Pattern ── */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-screen z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 85% 70% at 50% 50%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 50%, black 20%, transparent 80%)',
          }}
        />
      )}
    </div>
  );
}
