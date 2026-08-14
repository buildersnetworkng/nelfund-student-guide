import { scamTips } from '../lib/data'

export default function StaySafe() {
  return (
    <section className="card border-rust-500/30 bg-rust-100/40">
      <h2 className="font-display text-base font-semibold text-rust-500">🛡 Stay safe</h2>
      <ul className="mt-3 space-y-2">
        {scamTips.map((t) => (
          <li key={t.id} className="flex gap-2 text-sm text-ink/70">
            <span aria-hidden="true">•</span>
            {t.tip}
          </li>
        ))}
      </ul>
    </section>
  )
}
