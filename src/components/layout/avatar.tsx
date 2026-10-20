export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return src ? (
    <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} data-testid="avatar-image" />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      data-testid="avatar-initials"
    >
      {initials}
    </span>
  );
}
