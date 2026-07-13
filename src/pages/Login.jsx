import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'

export default function Login() {
  const { auth } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await auth(mode, { email, password, full_name: fullName })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center font-serif text-xl tracking-[0.35em] text-ink">
          R A T I O
        </p>
        <Card className="p-6">
          <h1 className="mb-1 font-serif text-lg text-ink">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mb-5 text-xs text-mink">
            {mode === 'login'
              ? 'Log in to keep your ratio.'
              : 'Track calories and macros, minimally.'}
          </p>
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </Button>
          </form>
        </Card>
        <button
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'))
            setError('')
          }}
          className="mt-4 w-full cursor-pointer text-center text-xs text-mink transition-colors duration-200 hover:text-ink"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
