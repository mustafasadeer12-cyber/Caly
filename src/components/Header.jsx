import { Link } from 'react-router-dom'
import { BarChart3, ChefHat, Database, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function Header({ onOpenSettings }) {
  const { logout } = useAuth()
  return (
    <header className="relative flex h-16 items-center justify-between">
      <div className="w-20" />
      <Link
        to="/"
        className="absolute left-1/2 -translate-x-1/2 font-serif text-lg tracking-[0.35em] text-ink"
      >
        R A T I O
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          to="/History"
          title="History"
          className="rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
        >
          <BarChart3 size={18} />
        </Link>
        <Link
          to="/Recipes"
          title="Recipes"
          className="rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
        >
          <ChefHat size={18} />
        </Link>
        <Link
          to="/FoodDatabase"
          title="Food Database"
          className="rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
        >
          <Database size={18} />
        </Link>
        <button
          onClick={onOpenSettings}
          title="Goal settings"
          className="cursor-pointer rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={logout}
          title="Log out"
          className="cursor-pointer rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
        >
          <LogOut size={18} />
        </button>
      </nav>
    </header>
  )
}
