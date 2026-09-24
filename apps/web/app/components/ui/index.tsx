import { Link } from 'react-router';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

import { Icon } from './icon';

export { Icon } from './icon';

/** Sinif birlestirici — kosullu sinifi olanlari eler. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// ─────────────────────────────────────────────
//  Buton
// ─────────────────────────────────────────────

type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'danger';
type ButtonSize = 'sm' | 'md';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-full font-medium ' +
  'whitespace-nowrap border transition-all duration-300 ease-soft ' +
  'disabled:pointer-events-none disabled:opacity-50';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-brand text-brand-contrast hover:bg-brand-hover hover:-translate-y-0.5',
  ghost:
    'border-line bg-surface text-ink hover:border-brand hover:text-brand hover:-translate-y-0.5',
  quiet: 'border-transparent text-ink-muted hover:text-brand',
  danger:
    'border-transparent bg-danger text-white hover:opacity-90 hover:-translate-y-0.5',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-6.5 py-3.5 text-[0.9375rem]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

// ─────────────────────────────────────────────
//  Yüzeyler
// ─────────────────────────────────────────────

export function Card({
  className,
  children,
  hover = false,
  ...rest
}: { className?: string; children: ReactNode; hover?: boolean } & Record<string, unknown>) {
  return (
    <div
      className={cx(
        'rounded-lg border border-line bg-surface transition-all duration-500 ease-soft',
        hover && 'hover:-translate-y-1 hover:border-brand hover:shadow-lg',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full bg-tint px-3.5 py-1.5 text-[0.8125rem] font-medium text-brand',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function IconFrame({
  name,
  size = 46,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'grid shrink-0 place-items-center rounded-md bg-tint text-brand transition-colors duration-500 ease-soft',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={Math.round(size * 0.45)} />
    </span>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="44"
        strokeDashoffset="14"
        opacity="0.9"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Form elemanları
// ─────────────────────────────────────────────

const FIELD =
  'w-full rounded-md border border-line bg-surface px-4 py-3 text-[0.9375rem] ' +
  'text-ink placeholder:text-ink-faint transition-colors duration-300 ' +
  'focus:border-brand focus:outline-none disabled:opacity-60';

interface FieldWrapProps {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, error, hint, required, children, htmlFor }: FieldWrapProps) {
  return (
    <div className="grid gap-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium tracking-wider text-ink-faint uppercase"
        >
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      {children}
      {/* role="alert": ekran okuyucu hatayi anlık duyursun */}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(FIELD, 'min-h-32 resize-y', className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(FIELD, 'cursor-pointer', className)} {...rest}>
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────
//  Durum göstergeleri
// ─────────────────────────────────────────────

export function EmptyState({
  icon = 'file',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <IconFrame name={icon} size={52} />
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      {children}
    </p>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-brand/30 bg-tint px-4 py-3 text-sm text-brand">
      {children}
    </p>
  );
}

/** Yükleme sırasında yer tutucu — içerik atlamasini (layout shift) önler. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('animate-pulse rounded-md bg-line-soft', className)} />
  );
}

// ─────────────────────────────────────────────
//  Bölüm başlığı
// ─────────────────────────────────────────────

export function SectionHead({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-12 grid gap-4 md:grid-cols-[1fr_auto] md:items-end md:gap-10">
      <div>
        {eyebrow && (
          <span className="eyebrow mb-4" data-reveal="fade">
            <span className="h-px w-6 bg-brand opacity-60" />
            {eyebrow}
          </span>
        )}
        <h2 className="max-w-[20ch] text-[clamp(2rem,4vw,3rem)]" data-reveal>
          {title}
        </h2>
        {lede && (
          <p
            className="mt-5 max-w-[56ch] text-[1.0625rem] leading-relaxed text-ink-muted"
            data-reveal
            style={{ '--delay': '80ms' } as React.CSSProperties}
          >
            {lede}
          </p>
        )}
      </div>
      {action && (
        <div data-reveal="fade" style={{ '--delay': '120ms' } as React.CSSProperties}>
          {action}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Randevu durumu rozeti
// ─────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Onay bekliyor',
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  NO_SHOW: 'Gelinmedi',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-tint text-brand',
  CONFIRMED: 'bg-brand text-brand-contrast',
  COMPLETED: 'bg-line-soft text-ink-muted',
  CANCELLED: 'bg-danger/10 text-danger',
  NO_SHOW: 'bg-line-soft text-ink-faint',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        STATUS_STYLE[status] ?? 'bg-line-soft text-ink-muted',
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;
