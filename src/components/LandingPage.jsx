import React, { useState } from 'react'
import { 
  TrendingUp, 
  ShieldCheck, 
  Mail, 
  Zap, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Percent 
} from 'lucide-react'

function LandingPage({ onStartDemo }) {
  // Calculator States
  const [mrr, setMrr] = useState(15000)
  const [churnRate, setChurnRate] = useState(7) // percentage of failed payments

  // Calculations
  const lostRevenue = Math.round(mrr * (churnRate / 100))
  // Optimized recovery rate is around 65%
  const recoveredRevenue = Math.round(lostRevenue * 0.65)
  const toolCost = 29
  const netRoi = recoveredRevenue - toolCost

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Background Gradients & Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400 mb-6 animate-pulse-subtle">
          <Sparkles className="w-3.5 h-3.5" />
          <span>El Micro-SaaS para recuperar tu dinero en 2026</span>
        </div>
        
        <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Recupera tus cobros fallidos de{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Stripe
          </span>{' '}
          en piloto automático
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed mb-10">
          El 9% de tus ingresos por suscripción se pierde por tarjetas vencidas o sin fondos. 
          RecoverFlow automatiza emails de dunning interactivos y recupera hasta el 65% del dinero perdido.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onStartDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Ver Demo Interactiva</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a 
            href="#calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold text-slate-300 hover:text-white transition-all duration-200"
          >
            Calcular mi ROI
          </a>
        </div>

        {/* Floating Metrics Preview */}
        <div className="mt-16 max-w-4xl mx-auto rounded-2xl glassmorphism p-2 shadow-2xl border border-slate-900 relative group overflow-hidden glow-violet">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 pointer-events-none z-10"></div>
          <div className="bg-slate-950/40 rounded-xl p-6 flex flex-col md:flex-row items-center justify-around gap-6 text-left relative z-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Tasa de Recuperación</span>
                <span className="text-2xl font-heading font-extrabold text-emerald-400">65.4% promedio</span>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-900 hidden md:block"></div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Correos Abiertos</span>
                <span className="text-2xl font-heading font-extrabold text-violet-400">84.2% tasa de apertura</span>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-900 hidden md:block"></div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Integración en Stripe</span>
                <span className="text-2xl font-heading font-extrabold text-indigo-400">Listo en 3 minutos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="calculator" className="relative border-y border-slate-900 bg-slate-950/50 py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              ¿Cuánto dinero estás perdiendo ahora mismo?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-light">
              Mueve los controles para ver la estimación de pérdidas por pagos fallidos y cuánto podrías recuperar este mes con RecoverFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
            {/* Inputs Card */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-900 bg-slate-950/70 p-8 flex flex-col justify-between space-y-8">
              {/* Input MRR */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">Ingresos Mensuales Recurrentes (MRR)</label>
                  <span className="text-xl font-heading font-bold text-violet-400">${mrr.toLocaleString()} USD</span>
                </div>
                <input 
                  type="range" 
                  min="2000" 
                  max="100000" 
                  step="1000"
                  value={mrr} 
                  onChange={(e) => setMrr(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>$2k</span>
                  <span>$50k</span>
                  <span>$100k</span>
                </div>
              </div>

              {/* Input Churn Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">Porcentaje de Pagos Fallidos al Mes</label>
                  <span className="text-xl font-heading font-bold text-violet-400">{churnRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="20" 
                  step="1"
                  value={churnRate} 
                  onChange={(e) => setChurnRate(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>2% (Bajo)</span>
                  <span>10% (Normal)</span>
                  <span>20% (Crítico)</span>
                </div>
              </div>

              {/* Notice */}
              <p className="text-xs text-slate-500 leading-relaxed pt-4 border-t border-slate-900/50">
                * Estimación basada en métricas promedio de Stripe. La tasa de recuperación real puede variar según el nicho y el flujo de correos configurado.
              </p>
            </div>

            {/* Outputs Card */}
            <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 flex flex-col justify-between relative overflow-hidden glow-emerald">
              {/* Highlight background light */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-widest block font-bold">Pérdida Mensual Estimada</span>
                  <span className="text-3xl font-heading font-extrabold text-red-400">${lostRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-500">USD/mes</span></span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <span className="text-xs text-emerald-400 uppercase tracking-widest block font-bold">Ingresos Recuperados con RecoverFlow</span>
                  <span className="text-4xl font-heading font-black text-emerald-400">${recoveredRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-500">USD/mes</span></span>
                </div>

                <div className="flex justify-between text-sm py-2 border-y border-slate-800">
                  <span className="text-slate-400">Costo de la Licencia:</span>
                  <span className="font-bold text-slate-200">${toolCost}/mes</span>
                </div>
              </div>

              <div className="pt-8 space-y-4 relative z-10">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-slate-400">ROI Neto Mensual:</span>
                  <span className="text-2xl font-heading font-extrabold text-white">+${netRoi.toLocaleString()} USD</span>
                </div>
                
                <button 
                  onClick={onStartDemo}
                  className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Probar con mi Cuenta Stripe</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-24 z-10">
        <div className="text-center mb-20">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Construido para recuperar cada centavo
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto font-light">
            Recupera ingresos sin molestar a tus clientes con flujos automatizados elegantes y de marca blanca.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Emails de Pago Interactivos</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                Tus clientes reciben emails personalizados con un enlace seguro. Pueden pagar o actualizar su tarjeta en un clic, sin necesidad de iniciar sesión ni recordar contraseñas.
              </p>
            </div>
            <div className="pt-6 text-xs text-violet-400 font-semibold flex items-center space-x-1 cursor-pointer" onClick={onStartDemo}>
              <span>Ver plantilla de email</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Reintentos Inteligentes</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                No satures los bancos de tus clientes. Usamos reintentos inteligentes basados en patrones de pago óptimos (días de pago típicos) para maximizar la tasa de éxito de cobro.
              </p>
            </div>
            <div className="pt-6 text-xs text-indigo-400 font-semibold flex items-center space-x-1 cursor-pointer" onClick={onStartDemo}>
              <span>Cómo funcionan los reintentos</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Configuración en 3 Pasos</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                Sin necesidad de código complejo. Generas una clave de API restringida de Stripe, configuras un webhook de lectura y listo. Estarás recuperando dinero en 3 minutos.
              </p>
            </div>
            <div className="pt-6 text-xs text-emerald-400 font-semibold flex items-center space-x-1 cursor-pointer" onClick={onStartDemo}>
              <span>Ver tutorial de configuración</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-slate-900 bg-slate-950/20 py-24 px-6 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-heading text-3xl sm:text-5xl font-black tracking-tight">
            Comienza a recuperar tus ingresos hoy
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto font-light leading-relaxed">
            Instala la demo sandbox interactiva y simula cómo se recuperan los cobros fallidos antes de conectar tu Stripe de producción.
          </p>
          <div className="pt-4">
            <button 
              onClick={onStartDemo}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Acceder al Dashboard Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage
