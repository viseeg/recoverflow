import React, { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'

function AuthPage({ onAuthSuccess, onBackToLanding }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isServerMode = window.location.protocol.startsWith('http');

    if (!isServerMode) {
      // Fallback local mode (portabilidad in-memory)
      setLoading(false);
      const mockUser = {
        id: "usr_demo",
        email: email || "demo@recoverflow.com",
        settings: {
          businessName: businessName || "Tu Startup SaaS",
          brandColor: "#8b5cf6",
          brandLogo: "🌊",
          supportEmail: email || "soporte@tu-startup.com",
          dunningSequence: [
            { step: 1, title: "Aviso Amigable", delay: 1, subject: "⚠️ Acción Requerida...", body: "...", buttonText: "..." }
          ]
        }
      };
      localStorage.setItem('rf_token', 'mock_token_base64');
      localStorage.setItem('rf_user', JSON.stringify(mockUser));
      onAuthSuccess(mockUser, 'mock_token_base64');
      return;
    }

    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, businessName };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en la autenticación.');
      }

      localStorage.setItem('rf_token', data.token);
      localStorage.setItem('rf_user', JSON.stringify(data.user));
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden my-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        <h2 className="font-heading text-2xl font-black text-center text-white mb-2">
          {isLogin ? 'Bienvenido a RecoverFlow' : 'Crea tu Cuenta'}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-8">
          {isLogin ? 'Ingresa tus credenciales para administrar tus cobros' : 'Empieza a recuperar ingresos en piloto automático hoy'}
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Nombre de tu Empresa / SaaS</label>
              <input 
                type="text" 
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="Ej. Mi Startup SaaS"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white shadow-md shadow-violet-600/10 hover:shadow-violet-600/30 flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <span>{loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <span>{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}</span>
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-violet-400 hover:text-violet-300 font-bold ml-1.5 focus:outline-none"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
          </button>
        </div>

        <button 
          onClick={onBackToLanding}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-400 mt-6 block focus:outline-none"
        >
          Volver a Inicio
        </button>
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('landing') // 'landing' | 'dashboard' | 'auth'
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('rf_token')
    const savedUser = localStorage.getItem('rf_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleAuthSuccess = (authUser, authToken) => {
    setUser(authUser)
    setToken(authToken)
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('rf_token')
    localStorage.removeItem('rf_user')
    setUser(null)
    setToken(null)
    setCurrentView('landing')
  }

  const handleStartDemo = () => {
    if (token) {
      setCurrentView('dashboard')
    } else {
      setCurrentView('auth')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-all duration-300">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 flex items-center justify-center font-heading font-black text-xl text-white shadow-lg shadow-violet-500/20">
            RF
          </div>
          <span className="font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            RecoverFlow
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          {currentView === 'landing' && (
            <>
              <button 
                onClick={handleStartDemo}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {token ? 'Ver mi Dashboard' : 'Iniciar Sesión'}
              </button>
              <button 
                onClick={handleStartDemo}
                className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-violet-600 font-semibold text-sm text-white shadow-md shadow-violet-600/10 hover:shadow-violet-600/30 hover:bg-violet-500 transition-all duration-200"
              >
                {token ? 'Ir al Panel' : 'Probar Gratis'}
              </button>
            </>
          )}

          {currentView === 'auth' && (
            <button 
              onClick={() => setCurrentView('landing')}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Volver a Inicio
            </button>
          )}

          {currentView === 'dashboard' && (
            <>
              <button 
                onClick={() => setCurrentView('landing')}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Volver a Inicio
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                <span>{user?.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-all duration-200"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentView === 'landing' && (
          <LandingPage onStartDemo={handleStartDemo} />
        )}
        {currentView === 'auth' && (
          <AuthPage onAuthSuccess={handleAuthSuccess} onBackToLanding={() => setCurrentView('landing')} />
        )}
        {currentView === 'dashboard' && (
          <Dashboard onLogout={handleLogout} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 RecoverFlow. Todos los derechos reservados. Creado con fines de validación de micro-SaaS.</p>
          <div className="flex space-x-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacidad</span>
            <span className="hover:text-slate-400 cursor-pointer">Términos</span>
            <span className="hover:text-slate-400 cursor-pointer">Soporte</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
