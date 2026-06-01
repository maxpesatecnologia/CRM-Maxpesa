// Símbolo circular da Maxpesa — bola vermelha + M bold + faísca laranja
function LogoMark({ size = 40 }) {
  const spark = Math.round(size * 0.32);
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(145deg, #E30613 0%, #B30000 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(227,6,19,0.5)',
      flexShrink: 0,
      position: 'relative',
    }}>
      <span style={{
        fontFamily: 'Oswald, sans-serif',
        fontWeight: 700,
        fontSize: Math.round(size * 0.58),
        color: '#FFFFFF',
        lineHeight: 1,
        letterSpacing: '-1px',
        userSelect: 'none',
        paddingBottom: '1px',
      }}>M</span>

      {/* Faísca laranja no canto superior direito */}
      <svg
        width={spark} height={spark} viewBox="0 0 10 10"
        style={{ position: 'absolute', top: -Math.round(spark * 0.25), right: -Math.round(spark * 0.18), pointerEvents: 'none' }}
      >
        <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z" fill="#FF6A00" />
      </svg>
    </div>
  );
}

// ── Variante Sidebar (fundo escuro, horizontal) ─────────────────────────────
export function SidebarLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <LogoMark size={36} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 700,
          fontSize: '21px',
          color: '#FFFFFF',
          letterSpacing: '2.5px',
          lineHeight: 1,
        }}>MAXPESA</span>
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 500,
          fontSize: '9px',
          color: '#FF6A00',
          letterSpacing: '3px',
          lineHeight: 1.6,
          textTransform: 'uppercase',
        }}>CRM Comercial</span>
      </div>
    </div>
  );
}

// Somente o símbolo — usado quando sidebar está recolhida
export function SidebarLogoMark() {
  return <LogoMark size={32} />;
}

// ── Variante Login (fundo branco, centralizada, maior) ──────────────────────
export function LoginLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <LogoMark size={68} />
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <div style={{
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 700,
          fontSize: '38px',
          color: '#111111',
          letterSpacing: '4px',
          lineHeight: 1,
        }}>MAXPESA</div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '12.5px',
          color: '#666666',
          letterSpacing: '1.5px',
          marginTop: '8px',
          textTransform: 'uppercase',
        }}>CRM &amp; Gestão Comercial</div>
      </div>
    </div>
  );
}
