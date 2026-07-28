// Set de iconos sobrios (trazo, un solo color) usado en todo el dashboard,
// en vez de emojis — mismo lenguaje visual que los iconos de la landing.

type IconProps = { size?: number; className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconAgenda({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
    </svg>
  );
}

export function IconCitas({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
      <path d="M8.5 14l2 2 4-4" />
    </svg>
  );
}

export function IconPacientes({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="8.5" cy="7.5" r="3" />
      <path d="M2.5 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <path d="M16.5 9a2.8 2.8 0 100-5.6" />
      <path d="M15 14.2c2.6.4 4.5 2.6 4.5 5.8" />
    </svg>
  );
}

export function IconProfesional({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    </svg>
  );
}

export function IconServicios({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3v-.5a1.5 1.5 0 013 0V3" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
    </svg>
  );
}

export function IconPagos({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
      <path d="M2.5 10.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}

export function IconPaquetes({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 8l8.5-4.5L20.5 8l-8.5 4.5L3.5 8z" />
      <path d="M3.5 8v8l8.5 4.5m0-8.5v8.5m8.5-12.5v8L12 20.5" />
    </svg>
  );
}

export function IconReportes({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M2.5 20h19" />
    </svg>
  );
}

export function IconMensajes({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 12a8 8 0 1114.8 4.2l1.2 3.8-4-1.1A8 8 0 013.5 12z" />
    </svg>
  );
}

export function IconConfiguracion({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.55 1.55M17.55 17.55L19.1 19.1M3 12h2.2M18.8 12H21M4.9 19.1l1.55-1.55M17.55 6.45L19.1 4.9" />
    </svg>
  );
}

export function IconLink({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9.5 14.5l5-5" />
      <path d="M8 17l-2.5 2.5a3.5 3.5 0 01-5-5L3 12" />
      <path d="M16 7l2.5-2.5a3.5 3.5 0 015 5L21 12" />
    </svg>
  );
}

export function IconReloj({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconPaleta({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3c1.5 0 2.7-1.2 2.7-2.7C19.5 6.7 16.1 3 12 3z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBusqueda({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}

export function IconBandeja({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 12h4.5l1.5 3h6l1.5-3H21" />
      <path d="M5.5 5h13L21 12v6a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18v-6L5.5 5z" />
    </svg>
  );
}

export function IconSeleccionar({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 3l13 7.5-5.5 1.3L11.8 17 6 3z" />
    </svg>
  );
}
