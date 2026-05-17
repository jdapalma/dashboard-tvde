import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await signUp(email, password, fullName)
      } else {
        await signIn(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0b1e] px-4">
      <div className="w-full max-w-md bg-[#1a1432] rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          Dashboard TVDE
        </h1>
        <p className="text-[#94a3b8] text-center mb-8">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3b2d5e]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1a1432] text-[#94a3b8]">o</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors border border-[#3b2d5e]"
        >
          Continuar con Google
        </button>

        <p className="text-center mt-6 text-[#94a3b8] text-sm">
          {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-[#a855f7] hover:underline"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}
