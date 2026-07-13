import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Dashboard from './pages/Dashboard'
import FoodDatabase from './pages/FoodDatabase'
import Recipes from './pages/Recipes'
import History from './pages/History'
import Login from './pages/Login'

function Shell() {
  const { authed } = useAuth()
  if (!authed) return <Login />
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/FoodDatabase" element={<FoodDatabase />} />
      <Route path="/Recipes" element={<Recipes />} />
      <Route path="/History" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
