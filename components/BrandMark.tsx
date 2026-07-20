import Link from 'next/link'

type Props = { compact?: boolean; className?: string; href?: string }

export function BrandMark({ compact = false, className = '', href = '/' }: Props) {
  const mark = <span className={`brand-mark ${compact ? 'brand-mark-compact' : ''} ${className}`.trim()} aria-label="K-VERSATION">
    <span className="brand-k">K</span><span className="brand-bridge" aria-hidden="true"><i /></span><span className="brand-rest">{compact ? 'V' : 'VERSATION'}</span>
  </span>
  return href ? <Link className="brand-link" href={href}>{mark}</Link> : mark
}

export function BrandSymbol({ className = '' }: { className?: string }) {
  return <span className={`brand-symbol ${className}`.trim()} aria-label="K-VERSATION"><i /><i /></span>
}
