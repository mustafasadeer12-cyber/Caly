import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, children }) {
  return (
    <header className="flex h-16 items-center justify-between">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
          title="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-serif text-lg text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  )
}
