/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('caly-user'))
    } catch {
      return null
    }
  })

  const authed = !!localStorage.getItem('caly-token') && !!user

  async function auth(action, payload) {
    const data = await api.post('/auth', { action, ...payload })
    localStorage.setItem('caly-token', data.token)
    localStorage.setItem('caly-user', JSON.stringify(data.user))
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem('caly-token')
    localStorage.removeItem('caly-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, authed, auth, logout }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
