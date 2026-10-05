/**
 * Apple Liquid Glass Ambient Background
 * - Deep dark background canvas (#06080E)
 * - Ultra-subtle ambient light orbs that illuminate translucent glass surfaces
 * - Micro-fine tech grid pattern with radial fade mask
 * - Lightweight, zero-performance overhead, pure CSS
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
      {/* ── Liquid Ambient Glow Orbs ── */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/[0.07] blur-[120px] animate-float pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] rounded-full bg-indigo-600/[0.06] blur-[130px] animate-float-slow pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full bg-emerald-600/[0.04] blur-[140px] pointer-events-none" />

      {/* ── Subtle Apple-style Grid Pattern ── */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 85% 70% at 50% 50%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 50%, black 20%, transparent 80%)',
          }}
        />
      )}
    </div>
  );
}
