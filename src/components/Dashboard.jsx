import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Mail, 
  DollarSign, 
  Percent, 
  Play, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Send, 
  Plus, 
  Eye, 
  HelpCircle,
  Settings,
  Code
} from 'lucide-react'

function Dashboard() {
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('rf_token');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
  };
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'settings' | 'integration'
  const [integrationLang, setIntegrationLang] = useState('express') // 'express' | 'nextjs' | 'curl'
  const [copied, setCopied] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  
  // Sequence builder active step index
  const [selectedStepIndex, setSelectedStepIndex] = useState(0)

  // Settings State with LocalStorage & Server-Side Persistence
  const [settings, setSettings] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('recoverflow_settings') : null
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure dunningSequence exists
        if (!parsed.dunningSequence) {
          parsed.dunningSequence = [
            {
              step: 1,
              title: "Aviso Amigable",
              delay: 1, // Días después del fallo
              subject: "⚠️ Acción Requerida: Tu pago mensual ha fallado",
              body: `Hola {nombre_cliente}, te escribimos porque tu banco ha rechazado el pago correspondiente a tu suscripción. El cobro de {monto} no pudo ser procesado.\n\nPor favor, actualiza tu tarjeta para seguir disfrutando de nuestro servicio.`,
              buttonText: "Actualizar Tarjeta & Reintentar Pago"
            },
            {
              step: 2,
              title: "Segundo Recordatorio",
              delay: 3,
              subject: "🚨 Recordatorio: Tu suscripción está en pausa temporal",
              body: `Hola {nombre_cliente}, este es nuestro segundo intento de cobro del mes. No pudimos procesar el cargo de {monto}.\n\nHemos pausado tu acceso temporalmente. Puedes reanudarlo al instante actualizando tus datos de facturación aquí.`,
              buttonText: "Reactivar mi Suscripción"
            },
            {
              step: 3,
              title: "Aviso de Suspensión",
              delay: 7,
              subject: "🚫 Alerta: Tu cuenta será suspendida definitivamente",
              body: `Hola {nombre_cliente}, hemos realizado múltiples intentos de cobro sin éxito. Tu suscripción de {monto} será cancelada definitivamente al final del día si no actualizas tu método de pago.`,
              buttonText: "Evitar Cancelación & Pagar"
            }
          ]
        }
        return parsed
      } catch (e) {
        console.error('Error parsing settings:', e)
      }
    }
    return {
      businessName: 'Tu Startup SaaS',
      brandColor: '#8b5cf6', // Violet color by default
      brandLogo: '🌊',
      supportEmail: 'soporte@tu-startup.com',
      dunningSequence: [
        {
          step: 1,
          title: "Aviso Amigable",
          delay: 1,
          subject: "⚠️ Acción Requerida: Tu pago mensual ha fallado",
          body: `Hola {nombre_cliente}, te escribimos porque tu banco ha rechazado el pago correspondiente a tu suscripción. El cobro de {monto} no pudo ser procesado.\n\nPor favor, actualiza tu tarjeta para seguir disfrutando de nuestro servicio.`,
          buttonText: "Actualizar Tarjeta & Reintentar Pago"
        },
        {
          step: 2,
          title: "Segundo Recordatorio",
          delay: 3,
          subject: "🚨 Recordatorio: Tu suscripción está en pausa temporal",
          body: `Hola {nombre_cliente}, este es nuestro segundo intento de cobro del mes. No pudimos procesar el cargo de {monto}.\n\nHemos pausado tu acceso temporalmente. Puedes reanudarlo al instante actualizando tus datos de facturación aquí.`,
          buttonText: "Reactivar mi Suscripción"
        },
        {
          step: 3,
          title: "Aviso de Suspensión",
          delay: 7,
          subject: "🚫 Alerta: Tu cuenta será suspendida definitivamente",
          body: `Hola {nombre_cliente}, hemos realizado múltiples intentos de cobro sin éxito. Tu suscripción de {monto} será cancelada definitivamente al final del día si no actualizas tu método de pago.`,
          buttonText: "Evitar Cancelación & Pagar"
        }
      ]
    }
  })

  const isServerMode = typeof window !== 'undefined' && window.location.protocol.startsWith('http');

  // Sync settings with LocalStorage and Server (if in server mode)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recoverflow_settings', JSON.stringify(settings))
    }
    if (isServerMode) {
      const saveSettingsToServer = async () => {
        try {
          await fetchWithAuth('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
          });
        } catch (e) {
          console.error("Error saving settings to server:", e);
        }
      };
      saveSettingsToServer();
    }
  }, [settings])

  const loadServerData = async () => {
    if (!isServerMode) return;
    try {
      const resClients = await fetchWithAuth('/api/clients');
      const clients = await resClients.json();
      setPayments(clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        mrr: c.amount,
        status: c.status,
        date: new Date(c.date).toLocaleDateString() === 'Invalid Date' ? c.date : new Date(c.date).toLocaleDateString(),
        retries: c.history ? c.history.filter(h => h.status === 'Fallido').length : 1
      })));

      const resStats = await fetchWithAuth('/api/stats');
      const stats = await resStats.json();
      setBaseMonthlyStats(stats.monthlyTrend.map(t => ({
        month: t.month,
        recovered: t.rec,
        churned: t.lost
      })));

      const resSettings = await fetchWithAuth('/api/settings');
      const serverSettings = await resSettings.json();
      if (serverSettings && serverSettings.dunningSequence) {
        setSettings(serverSettings);
      }
    } catch (err) {
      console.error("Error loading server data:", err);
    }
  };

  useEffect(() => {
    if (isServerMode) {
      loadServerData();
    }
  }, []);

  // Helper to dynamically format the dunning email body
  const formatEmailBody = (text, clientName, amount) => {
    if (!text) return ''
    return text
      .replace(/{nombre_cliente}/g, clientName || 'Cliente')
      .replace(/{monto}/g, `$${amount} USD`)
  }

  // Initial Payments State (In-memory fallback for File Mode)
  const [payments, setPayments] = useState([
    { id: 'cli_1', name: 'Carlos Delgado', email: 'carlos@ejemplo.com', mrr: 49, status: 'En Proceso', date: 'Ahora mismo', retries: 1 },
    { id: 'cli_2', name: 'María Gómez', email: 'maria@ejemplo.com', mrr: 89, status: 'Recuperado', date: 'Hace 2 horas', retries: 1 },
    { id: 'cli_3', name: 'Alex Chen', email: 'alex@ejemplo.com', mrr: 129, status: 'Reintentando', date: 'Ayer', retries: 1 },
    { id: 'cli_4', name: 'Elena Rostova', email: 'elena@ejemplo.com', mrr: 199, status: 'Fallido', date: 'Hace 3 días', retries: 3 }
  ])

  // Simulator Inputs State
  const [simName, setSimName] = useState('')
  const [simEmail, setSimEmail] = useState('')
  const [simAmount, setSimAmount] = useState(49)
  
  // Terminal logs state
  const [logs, setLogs] = useState([
    '🔥 RecoverFlow Sandbox listo.',
    '🔌 Conectado a Stripe (Modo de Prueba).',
    '📧 Conectado a Resend API.'
  ])

  // Email preview modal / state
  const [activeEmailPreview, setActiveEmailPreview] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Base monthly stats for analytics trend (Jan - Jun)
  const [baseMonthlyStats, setBaseMonthlyStats] = useState([
    { month: 'Ene', recovered: 8200, churned: 1500 },
    { month: 'Feb', recovered: 9400, churned: 1800 },
    { month: 'Mar', recovered: 11200, churned: 2100 },
    { month: 'Abr', recovered: 10500, churned: 2400 },
    { month: 'May', recovered: 12850, churned: 2840 },
    { month: 'Jun', recovered: 89, churned: 199 }
  ])

  // Calculating Metrics dynamically
  const totalRecovered = payments
    .filter(p => p.status === 'Recuperado')
    .reduce((acc, curr) => acc + curr.mrr, 0)
  const totalFailed = payments
    .filter(p => p.status === 'Fallido')
    .reduce((acc, curr) => acc + curr.mrr, 0)
  const activeInRecovery = payments
    .filter(p => p.status === 'En Proceso' || p.status === 'Reintentando')
    .reduce((acc, curr) => acc + curr.mrr, 0)
  
  // Recovery Rate calculation
  const totalClosed = payments.filter(p => p.status === 'Recuperado' || p.status === 'Fallido')
  const recoveredClosed = payments.filter(p => p.status === 'Recuperado')
  const recoveryRate = totalClosed.length > 0 
    ? Math.round((recoveredClosed.length / totalClosed.length) * 100) 
    : 0

  // Log message helper
  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`])
  }

  // Trigger Webhook Simulation (Initial Attempt)
  const handleSimulateWebhook = async (e) => {
    e.preventDefault()
    if (!simName || !simEmail) {
      alert('Por favor ingresa un nombre y correo para la simulación.')
      return
    }

    if (isServerMode) {
      setIsSimulating(true)
      addLog(`Stripe Event: invoice.payment_failed recibido (Monto: $${simAmount} USD)`)
      
      try {
        const response = await fetchWithAuth('/api/simulate-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: simName,
            email: simEmail,
            amount: simAmount
          })
        });

        const newClient = await response.json();
        await loadServerData();

        setTimeout(() => {
          addLog(`RecoverFlow: Servidor persistió registro de dunning para ${simEmail}`)
        }, 800)

        setTimeout(() => {
          // Show REAL email status from server
          if (newClient.emailStatus === 'sent') {
            addLog(`✅ Resend API: ${newClient.emailMessage}`)
          } else if (newClient.emailStatus === 'error') {
            addLog(`❌ ${newClient.emailMessage}`)
          } else {
            addLog(`⚠️ ${newClient.emailMessage || 'Email no enviado (clave API no configurada)'}`)
          }
          setActiveEmailPreview({
            id: newClient.id,
            name: simName,
            email: simEmail,
            amount: simAmount,
            stepIndex: 0
          })
          setIsSimulating(false)
        }, 1600)
      } catch (err) {
        addLog(`❌ Error simulando webhook en el servidor: ${err.message}`)
        setIsSimulating(false)
      }
    } else {
      // Standalone Fallback File Mode
      setIsSimulating(true)
      addLog(`Stripe Event: invoice.payment_failed recibido (Monto: $${simAmount} USD)`)
      
      const newPaymentId = 'cli_' + Math.random().toString(36).substring(2, 9)
      const newPayment = {
        id: newPaymentId,
        name: simName,
        email: simEmail,
        mrr: Number(simAmount),
        status: 'En Proceso',
        date: 'Ahora mismo',
        retries: 1
      }

      setPayments(prev => [newPayment, ...prev])

      setBaseMonthlyStats(prev => prev.map(stat => {
        if (stat.month === 'Jun') {
          return { ...stat, churned: stat.churned + Number(simAmount) }
        }
        return stat
      }))

      setTimeout(() => {
        addLog(`RecoverFlow: Creando flujo de cobros fallidos en memoria para ${simEmail}`)
      }, 800)

      setTimeout(() => {
        const step1 = settings.dunningSequence[0];
        addLog(`Resend API (Simulado): Correo Paso 1 "${step1.title}" enviado a ${simEmail}`)
        setActiveEmailPreview({
          id: newPaymentId,
          name: simName,
          email: simEmail,
          amount: simAmount,
          stepIndex: 0
        })
        setIsSimulating(false)
      }, 1600)
    }
  }

  // Simulate Next Sequence Attempt (Cascade Retry)
  const handleAdvanceSequence = async (id, name, email, amount, currentRetries) => {
    const nextRetry = currentRetries + 1;
    addLog(`Stripe Event: invoice.payment_failed (Intento ${nextRetry}) para ${email}`);

    if (isServerMode) {
      try {
        const response = await fetchWithAuth(`/api/clients/${id}/advance`, {
          method: 'POST'
        });
        const data = await response.json();
        
        await loadServerData();

        if (data.client.status === 'Fallido') {
          addLog(`🚫 RecoverFlow: Cliente ${name} excedió los reintentos (${settings.dunningSequence.length}). Suscripción Cancelada.`);
        } else {
          addLog(`Resend API: Enviado correo Paso ${nextRetry} "${data.step.title}" a ${email}`);
          setActiveEmailPreview({
            id: data.client.id,
            name: name,
            email: email,
            amount: amount,
            stepIndex: nextRetry - 1
          });
        }
      } catch (err) {
        addLog(`❌ Error avanzando secuencia en el servidor: ${err.message}`);
      }
    } else {
      // Fallback local memory simulation
      const sequence = settings.dunningSequence;
      const isLastStep = nextRetry > sequence.length;

      setPayments(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: isLastStep ? 'Fallido' : 'Reintentando',
            retries: nextRetry
          }
        }
        return p;
      }));

      if (isLastStep) {
        setBaseMonthlyStats(prev => prev.map(stat => {
          if (stat.month === 'Jun') {
            return { ...stat, churned: stat.churned + Number(amount) }
          }
          return stat
        }))
        addLog(`🚫 RecoverFlow: Cliente ${name} superó reintentos (${sequence.length}). Cuenta suspendida definitivamente.`);
      } else {
        const step = sequence[nextRetry - 1];
        addLog(`Resend API (Simulado): Correo Paso ${nextRetry} "${step.title}" enviado a ${email}`);
        setActiveEmailPreview({
          id: id,
          name: name,
          email: email,
          amount: amount,
          stepIndex: nextRetry - 1
        });
      }
    }
  }

  // Simulated Recovery Button (Simulates user clicking email and updating card)
  const handleSimulateRecovery = async (id, email, amount) => {
    addLog(`Usuario: Hizo clic en el correo de dunning (${email}) y actualizó su tarjeta.`)
    addLog(`Stripe Event: invoice.payment_succeeded recibido (Cobro exitoso)`)
    
    if (isServerMode) {
      try {
        await fetchWithAuth('/api/clients/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: id })
        });

        // Reload data from server
        await loadServerData();

        addLog(`RecoverFlow: Suscripción recuperada y persistida en base de datos. +$${amount} USD.`)
        setActiveEmailPreview(null)
      } catch (err) {
        addLog(`❌ Error actualizando recuperación en el servidor: ${err.message}`)
      }
    } else {
      // Bypassed mode (local browser-only file fallback)
      setPayments(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, status: 'Recuperado' }
        }
        return p;
      }))

      setBaseMonthlyStats(prev => prev.map(stat => {
        if (stat.month === 'Jun') {
          // Subtract from lost/churned and add to recovered
          return { 
            ...stat, 
            recovered: stat.recovered + Number(amount),
            churned: Math.max(0, stat.churned - Number(amount))
          }
        }
        return stat
      }))
      
      addLog(`RecoverFlow: Suscripción recuperada con éxito. Total recuperado sumó +$${amount} USD.`)
      setActiveEmailPreview(null)
    }
  }

  // Helper to update specific fields of the current active step in editor
  const updateCurrentStepField = (field, value) => {
    const newSeq = [...settings.dunningSequence];
    newSeq[selectedStepIndex] = { ...newSeq[selectedStepIndex], [field]: value };
    setSettings({ ...settings, dunningSequence: newSeq });
  }

  // --- Dynamic SVG Chart calculations ---
  const maxVal = Math.max(
    ...baseMonthlyStats.map(s => Math.max(s.recovered, s.churned)),
    1000
  ) * 1.15 // 15% top padding

  const pointsRecovered = baseMonthlyStats.map((stat, idx) => {
    const x = 50 + idx * (420 / 5)
    const y = 170 - (stat.recovered / maxVal) * 140
    return { x, y, month: stat.month, value: stat.recovered }
  })

  const pointsChurned = baseMonthlyStats.map((stat, idx) => {
    const x = 50 + idx * (420 / 5)
    const y = 170 - (stat.churned / maxVal) * 140
    return { x, y, month: stat.month, value: stat.churned }
  })

  const linePathRecovered = pointsRecovered.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPathRecovered = `${linePathRecovered} L ${pointsRecovered[pointsRecovered.length - 1].x} 170 L ${pointsRecovered[0].x} 170 Z`

  const linePathChurned = pointsChurned.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPathChurned = `${linePathChurned} L ${pointsChurned[pointsChurned.length - 1].x} 170 L ${pointsChurned[0].x} 170 Z`

  // Current selected dunning step in editor
  const editorStep = settings.dunningSequence[selectedStepIndex] || settings.dunningSequence[0];

  const getCodeContent = () => {
    if (integrationLang === 'express') {
      let conditions = '';
      settings.dunningSequence.forEach((step, idx) => {
        conditions += `    ${idx === 0 ? 'if' : 'else if'} (attemptCount === ${step.step}) {
      emailSubject = "${step.subject.replace(/"/g, '\\"')}";
      emailBodyTemplate = \`${step.body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
      buttonText = "${step.buttonText.replace(/"/g, '\\"')}";
    }\n`;
      });
      conditions += `    else {
      // Excedido número de intentos, cancelar suscripción o suspender
      console.log('Cliente superó intentos, pausando cuenta.');
      return res.json({ received: true });
    }`;

      return `import express from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerEmail = invoice.customer_email;
    const customerName = invoice.customer_name || 'Cliente';
    const amount = (invoice.amount_due / 100).toFixed(2);
    const attemptCount = invoice.attempt_count || 1;

    let emailSubject = '';
    let emailBodyTemplate = '';
    let buttonText = '';

${conditions}
    
    // Formatear variables dinámicas
    const emailBodyFormatted = emailBodyTemplate
      .replace(/{nombre_cliente}/g, customerName)
      .replace(/{monto}/g, \`\$\${amount} USD\`);

    await resend.emails.send({
      from: "${settings.businessName} <facturacion@recoverflow.com>",
      to: customerEmail,
      subject: emailSubject,
      html: \`
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; color: #1e293b;">
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <div style="width: 36px; height: 36px; background-color: ${settings.brandColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 10px;">
              ${settings.brandLogo}
            </div>
            <span style="font-weight: bold; font-size: 18px; color: #0f172a;">${settings.businessName}</span>
          </div>
          <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola \${customerName},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; white-space: pre-wrap; margin-bottom: 24px;">\${emailBodyFormatted}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="\${invoice.hosted_invoice_url}" style="background-color: ${settings.brandColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              \${buttonText}
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Si tienes dudas, contáctanos a ${settings.supportEmail}
          </p>
        </div>
      \`
    });
  }

  res.json({ received: true });
});

app.listen(3000, () => console.log('Servidor RecoverFlow escuchando webhook en puerto 3000'));`;
    } else if (integrationLang === 'nextjs') {
      let conditions = '';
      settings.dunningSequence.forEach((step, idx) => {
        conditions += `    ${idx === 0 ? 'if' : 'else if'} (attemptCount === ${step.step}) {
      emailSubject = "${step.subject.replace(/"/g, '\\"')}";
      emailBodyTemplate = \`${step.body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
      buttonText = "${step.buttonText.replace(/"/g, '\\"')}";
    }\n`;
      });
      conditions += `    else {
      // Excedido número de intentos, cancelar suscripción
      console.log('Cliente superó intentos, pausando cuenta.');
      return NextResponse.json({ received: true });
    }`;

      return `import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any
});
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(\`Webhook Error: \${err.message}\`, { status: 400 });
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const customerEmail = invoice.customer_email;
    const customerName = invoice.customer_name || 'Cliente';
    const amount = (invoice.amount_due / 100).toFixed(2);
    const attemptCount = invoice.attempt_count || 1;

    let emailSubject = '';
    let emailBodyTemplate = '';
    let buttonText = '';

${conditions}
    
    // Formatear variables
    const emailBodyFormatted = emailBodyTemplate
      .replace(/{nombre_cliente}/g, customerName)
      .replace(/{monto}/g, \`\$\${amount} USD\`);

    await resend.emails.send({
      from: "${settings.businessName} <facturacion@recoverflow.com>",
      to: customerEmail!,
      subject: emailSubject,
      html: \`
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; color: #1e293b;">
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <div style="width: 36px; height: 36px; background-color: ${settings.brandColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 10px;">
              ${settings.brandLogo}
            </div>
            <span style="font-weight: bold; font-size: 18px; color: #0f172a;">${settings.businessName}</span>
          </div>
          <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola \${customerName},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; white-space: pre-wrap; margin-bottom: 24px;">\${emailBodyFormatted}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="\${invoice.hosted_invoice_url}" style="background-color: ${settings.brandColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              \text{buttonText}
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Si tienes dudas, contáctanos a ${settings.supportEmail}
          </p>
        </div>
      \`
    });
  }

  return NextResponse.json({ received: true });
}`;
    } else {
      return `curl -X POST http://localhost:3000/api/webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: t=1609459200,v1=simulated_signature_value" \\
  -d '{
    "id": "evt_123456",
    "object": "event",
    "type": "invoice.payment_failed",
    "data": {
      "object": {
        "id": "in_123456",
        "customer": "cus_12345",
        "customer_email": "carlos@ejemplo.com",
        "customer_name": "Carlos Delgado",
        "amount_due": 4900,
        "currency": "usd",
        "attempt_count": 2,
        "hosted_invoice_url": "https://invoice.stripe.com/i/acct_123/inv_123"
      }
    }
  }'`
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 relative z-10">
      
      {/* Dashboard Sub-Header / Navigation Tabs */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-900 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white tracking-tight">Panel de Control</h1>
          <p className="text-slate-400 text-sm font-light">Monitorea tus ingresos recuperados y personaliza tus campañas de email.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Monitoreo & Simulación
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setSelectedStepIndex(0);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Personalización de Email
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'integration' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Integración API
            </button>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Stripe Webhook Activo</span>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT & CENTER COLUMNS: Metrics, Charts, & Payments List */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start text-emerald-400">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Recuperado</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-heading font-extrabold text-white">${(3600 + totalRecovered).toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">+${totalRecovered.toLocaleString()} simulado hoy</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start text-violet-400">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Tasa Éxito</span>
                  <Percent className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-heading font-extrabold text-white">{recoveryRate || 65}%</span>
                  <span className="text-[10px] text-violet-400 block mt-1">Suscripciones cobradas</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start text-indigo-400">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">En Proceso</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-heading font-extrabold text-white">${activeInRecovery.toLocaleString()}</span>
                  <span className="text-[10px] text-indigo-400 block mt-1">MRR reintentando</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start text-red-400">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Churn Evitado</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-heading font-extrabold text-white">{payments.filter(p => p.status === 'Recuperado').length}</span>
                  <span className="text-[10px] text-red-400 block mt-1">Clientes salvados</span>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Chart 1: Tendencia de Churn vs Recuperación */}
              <div className="md:col-span-2 rounded-xl border border-slate-900 bg-slate-950 p-6 glow-violet relative">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <h3 className="font-heading font-bold text-white text-base">Recuperación mensual</h3>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-400">Recuperado</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span><span className="text-slate-400">Churn Involuntario</span></span>
                  </div>
                </div>

                <div className="relative h-[180px] w-full mt-4">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                      </linearGradient>
                      <linearGradient id="gradChurn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>

                    {/* Area Gradients */}
                    <path d={areaPathRecovered} fill="url(#gradRec)" />
                    <path d={areaPathChurned} fill="url(#gradChurn)" />

                    {/* Grid Lines */}
                    <line x1="50" y1="30" x2="470" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="50" y1="100" x2="470" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="50" y1="170" x2="470" y2="170" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                    {/* Lines */}
                    <path d={linePathRecovered} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <path d={linePathChurned} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Dots & Interactivity */}
                    {pointsRecovered.map((p, idx) => (
                      <g key={`rec-dot-${idx}`}>
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="4" 
                          fill="#020617" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          className="cursor-pointer hover:r-6 transition-all"
                          onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, val: `$${p.value} USD Rec`, month: p.month })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text x={p.x} y="190" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="mono">{p.month}</text>
                      </g>
                    ))}

                    {pointsChurned.map((p, idx) => (
                      <circle 
                        key={`ch-dot-${idx}`}
                        cx={p.x} 
                        cy={p.y} 
                        r="4" 
                        fill="#020617" 
                        stroke="#8b5cf6" 
                        strokeWidth="2.5" 
                        className="cursor-pointer hover:r-6 transition-all"
                        onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, val: `$${p.value} USD Churn`, month: p.month })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </svg>

                  {/* Chart Tooltip */}
                  {hoveredPoint && (
                    <div 
                      className="absolute bg-slate-900 border border-slate-800 text-[10px] text-white px-2 py-1 rounded shadow-lg pointer-events-none font-mono"
                      style={{ left: `${(hoveredPoint.x / 500) * 100}%`, top: `${(hoveredPoint.y / 200) * 100 - 20}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="font-bold">{hoveredPoint.month}</div>
                      <div>{hoveredPoint.val}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Eficacia por Reintento */}
              <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <h3 className="font-heading font-bold text-white text-base">Eficacia por Paso</h3>
                    <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">Secuencia</span>
                  </div>
                  <p className="text-slate-400 text-xs font-light mb-6">
                    Porcentaje de suscripciones recuperadas con éxito según el paso de email en la secuencia.
                  </p>

                  <div className="space-y-4">
                    {settings.dunningSequence.map((step, idx) => {
                      const colors = ["bg-violet-600", "bg-indigo-600", "bg-emerald-500", "bg-amber-500", "bg-red-500"];
                      const textColors = ["text-violet-400", "text-indigo-400", "text-emerald-400", "text-amber-400", "text-red-400"];
                      const mockRates = [48, 32, 15, 4, 1]; // Mock efficacy drop per step
                      const rate = mockRates[idx] || 5;

                      return (
                        <div key={step.step} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${colors[idx] || 'bg-slate-400'}`}></span>
                              <span>Paso {step.step}: {step.title}</span>
                            </span>
                            <span className={`${textColors[idx] || 'text-slate-400'} font-bold`}>{rate}%</span>
                          </div>
                          <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-900">
                            <div className={`${colors[idx] || 'bg-slate-500'} h-full rounded-full transition-all duration-500`} style={{ width: `${rate}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-900/50 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Recuperación promedio: ~65.4%</span>
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Optimización Activa</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Payments List Table */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
                <h3 className="font-heading font-bold text-white text-base">Historial de Cobros Fallidos</h3>
                <span className="text-xs text-slate-500">Mostrando {payments.length} eventos</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-900">
                    <tr>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Monto</th>
                      <th className="px-6 py-3">Paso Actual</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Fecha Evento</th>
                      <th className="px-6 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.email}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-200">
                          ${p.mrr} USD
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {p.status === 'Recuperado' ? (
                            <span className="text-emerald-400 font-semibold">Completado ✓</span>
                          ) : p.status === 'Fallido' ? (
                            <span className="text-red-400 font-semibold">Fallido 🚫</span>
                          ) : (
                            <span className="text-slate-300 font-medium">
                              Paso {p.retries}/{settings.dunningSequence.length}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.status === 'Recuperado' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : p.status === 'En Proceso'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                              : p.status === 'Reintentando'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            <span>{p.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {p.date}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {(p.status === 'En Proceso' || p.status === 'Reintentando') && (
                              <>
                                <button 
                                  onClick={() => setActiveEmailPreview({
                                    id: p.id,
                                    name: p.name,
                                    email: p.email,
                                    amount: p.mrr,
                                    stepIndex: p.retries - 1
                                  })}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-800 flex items-center space-x-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Email</span>
                                </button>
                                {p.retries <= settings.dunningSequence.length && (
                                  <button 
                                    onClick={() => handleAdvanceSequence(p.id, p.name, p.email, p.mrr, p.retries)}
                                    className="px-2.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-xs font-bold text-violet-400 hover:text-violet-300 border border-violet-500/20 flex items-center space-x-1"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Siguiente Intento</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Webhook Simulator & Console Log */}
          <div className="space-y-8">
            
            {/* Webhook Simulator Form */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 glow-violet">
              <div className="flex items-center space-x-2 text-violet-400 mb-4">
                <Play className="w-5 h-5 fill-current" />
                <h3 className="font-heading font-extrabold text-white text-lg">Simular Webhook de Stripe</h3>
              </div>
              <p className="text-slate-400 text-xs font-light mb-6">
                Dispara el webhook `invoice.payment_failed` de Stripe. Esto simulará el primer paso (intento 1) de la campaña de dunning.
              </p>

              <form onSubmit={handleSimulateWebhook} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Nombre del Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Carlos Delgado" 
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Email del Cliente</label>
                  <input 
                    type="email" 
                    placeholder="carlos@ejemplo.com" 
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Monto Mensual (USD)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10000"
                      value={simAmount}
                      onChange={(e) => setSimAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900/60 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-mono"
                      placeholder="Ej. 59"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      disabled={isSimulating}
                      className="w-full py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white shadow-md shadow-violet-600/10 hover:shadow-violet-600/30 flex items-center justify-center space-x-1.5 transition-all duration-200"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSimulating ? 'Simulando...' : 'Enviar Evento'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Live Terminal Log */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden">
              <div className="bg-slate-900/50 px-4 py-2 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Terminal className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-mono font-bold">Consola de Eventos</span>
                </div>
                <button 
                  onClick={() => setLogs(['🔥 Consola limpiada. Ready.'])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                >
                  Clear
                </button>
              </div>
              <div className="p-4 bg-slate-950 font-mono text-xs text-slate-400 space-y-2 max-h-[200px] overflow-y-auto font-light leading-relaxed">
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed border-l-2 border-violet-500/20 pl-2">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        /* SETTINGS TAB (SEQUENCE BUILDER) */
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
          
          {/* Customization Forms (3 cols) */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Branding Settings */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-6">
              <div className="flex items-center space-x-2 text-violet-400 border-b border-slate-900 pb-3">
                <Settings className="w-5 h-5" />
                <h2 className="font-heading text-lg font-bold text-white">Identidad de Marca</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Nombre de tu Empresa / SaaS</label>
                  <input 
                    type="text" 
                    value={settings.businessName}
                    onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    placeholder="Ej. Mi Startup SaaS"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Color Principal (Hex)</label>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input 
                          type="color" 
                          value={settings.brandColor}
                          onChange={(e) => setSettings({...settings, brandColor: e.target.value})}
                          className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={settings.brandColor}
                        onChange={(e) => setSettings({...settings, brandColor: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Logo / Emoji del Avatar</label>
                    <input 
                      type="text" 
                      maxLength="10"
                      value={settings.brandLogo}
                      onChange={(e) => setSettings({...settings, brandLogo: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      placeholder="Ej. S o ⚡ o 🌊"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dunning Sequence Timeline Builder */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-6">
              <div className="flex items-center space-x-2 text-violet-400 border-b border-slate-900 pb-3 justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <h2 className="font-heading text-lg font-bold text-white">Secuencia de Cobros Fallidos (Dunning)</h2>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full font-mono">
                  {settings.dunningSequence.length} Pasos Activos
                </span>
              </div>

              {/* Horizontal Timeline UI */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-3 border-b border-slate-900/60 mb-6 scrollbar-thin">
                {settings.dunningSequence.map((step, idx) => (
                  <button
                    key={step.step}
                    type="button"
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center space-x-2 border ${
                      selectedStepIndex === idx
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selectedStepIndex === idx ? 'bg-white text-violet-600' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.step}
                    </span>
                    <div className="text-left">
                      <div className="font-extrabold">{step.title}</div>
                      <div className="text-[9px] opacity-60">Día {step.delay}</div>
                    </div>
                  </button>
                ))}
                
                {settings.dunningSequence.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextStepNum = settings.dunningSequence.length + 1;
                      const nextDelay = (settings.dunningSequence[settings.dunningSequence.length - 1]?.delay || 0) + 3;
                      const newStep = {
                        step: nextStepNum,
                        title: `Paso ${nextStepNum}: Aviso Extra`,
                        delay: nextDelay,
                        subject: `⚠️ Aviso ${nextStepNum}: Detalle de tu suscripción`,
                        body: `Hola {nombre_cliente}, nos comunicamos nuevamente debido a que no hemos podido procesar el cobro de tu suscripción mensual de {monto}.\n\nPara evitar que se pierda el acceso a tus datos, por favor reintenta el pago aquí.`,
                        buttonText: "Reintentar Pago"
                      };
                      setSettings({ ...settings, dunningSequence: [...settings.dunningSequence, newStep] });
                      setSelectedStepIndex(settings.dunningSequence.length); // Switch to new step
                    }}
                    className="px-3 py-2.5 text-xs font-bold rounded-lg bg-slate-950 border border-slate-800 border-dashed text-violet-400 hover:text-violet-300 hover:border-slate-700 flex items-center space-x-1 shrink-0 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Paso</span>
                  </button>
                )}
              </div>

              {/* Selected Step Configurator */}
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Título del Paso</label>
                    <input 
                      type="text" 
                      value={editorStep.title}
                      onChange={(e) => updateCurrentStepField('title', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      placeholder="Ej. Recordatorio Amistoso"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Días de retraso (desde el fallo)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="45"
                      value={editorStep.delay}
                      onChange={(e) => updateCurrentStepField('delay', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    {settings.dunningSequence.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSeq = settings.dunningSequence
                            .filter((_, idx) => idx !== selectedStepIndex)
                            .map((s, idx) => ({ ...s, step: idx + 1 })); // Re-index steps
                          
                          setSettings({ ...settings, dunningSequence: newSeq });
                          setSelectedStepIndex(Math.max(0, selectedStepIndex - 1));
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-400 flex items-center justify-center space-x-1.5 transition-all duration-200"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Eliminar Paso {editorStep.step}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-900/50 pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Asunto del Email</label>
                    <input 
                      type="text" 
                      value={editorStep.subject}
                      onChange={(e) => updateCurrentStepField('subject', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      placeholder="Asunto para llamar la atención del cliente"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-400">Cuerpo del Mensaje (Soporta variables)</label>
                      <span className="text-[10px] text-slate-500">Variables útiles: <code className="text-violet-400 font-mono">{"{nombre_cliente}"}</code> y <code className="text-violet-400 font-mono">{"{monto}"}</code></span>
                    </div>
                    <textarea 
                      rows="6"
                      value={editorStep.body}
                      onChange={(e) => updateCurrentStepField('body', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none font-light leading-relaxed whitespace-pre-wrap"
                      placeholder="Escribe el mensaje explicando el fallo del pago..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Texto del Botón</label>
                      <input 
                        type="text" 
                        value={editorStep.buttonText}
                        onChange={(e) => updateCurrentStepField('buttonText', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Email de Soporte / Firma</label>
                      <input 
                        type="email" 
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Real-time Email Preview Panel (2 cols) */}
          <div className="xl:col-span-2 space-y-4 xl:sticky xl:top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Previsualización del Paso {editorStep.step}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Se actualiza en vivo</span>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
              {/* Mock Header Info */}
              <div className="bg-slate-900/40 p-4 border-b border-slate-900 text-xs text-slate-400 space-y-1">
                <div><span className="font-semibold text-slate-300">De:</span> facturacion@tu-startup.com <span className="text-[10px] text-slate-600">(vía RecoverFlow)</span></div>
                <div><span className="font-semibold text-slate-300">Para:</span> carlo.sanchez@ejemplo.com</div>
                <div className="truncate"><span className="font-semibold text-slate-300">Asunto:</span> {editorStep.subject}</div>
              </div>

              {/* Email Envelope Container */}
              <div className="bg-white p-8 text-slate-800 text-sm space-y-6">
                
                {/* Brand Header */}
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: settings.brandColor }}
                  >
                    {settings.brandLogo}
                  </div>
                  <span className="font-bold text-slate-900 text-base">{settings.businessName}</span>
                </div>

                {/* Email Body Content */}
                <div className="space-y-4">
                  <p className="font-semibold text-slate-900 text-base">Hola Carlos Delgado,</p>
                  <p className="text-slate-600 leading-relaxed font-light whitespace-pre-wrap">
                    {formatEmailBody(editorStep.body, 'Carlos Delgado', 49)}
                  </p>
                </div>

                {/* Brand Color CTA Button */}
                <div className="text-center pt-2">
                  <span 
                    className="inline-flex items-center space-x-2 px-6 py-3 text-white font-bold rounded-lg shadow-md cursor-default text-xs"
                    style={{ backgroundColor: settings.brandColor }}
                  >
                    {editorStep.buttonText}
                  </span>
                </div>

                {/* Support Footer */}
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                  Si tienes dudas, contáctanos a {settings.supportEmail}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/40 border border-slate-900 p-4 text-xs text-slate-400 leading-relaxed space-y-2">
              <p>💡 <strong>¿Secuencia en Cascada?</strong> Programar múltiples reintentos con tonos progresivos incrementa tu recuperación: el primer email suele ser un aviso informal, mientras que el último es un aviso formal de suspensión.</p>
            </div>
          </div>
        </div>
      ) : (
        /* INTEGRATION TAB */
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
          {/* Integration Guide Checklist (2 cols) */}
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-6">
              <div className="flex items-center space-x-2 text-violet-400 border-b border-slate-900 pb-3">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="font-heading text-lg font-bold text-white">Guía de Integración Rápida</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">1. Configura la Secuencia</h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Ajusta los pasos, asuntos y cuerpos de tu campaña en <strong>Personalización de Email</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">2. Claves API en tu .env</h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Agrega tu <code>STRIPE_SECRET_KEY</code> y <code>RESEND_API_KEY</code> en tu archivo de configuración ambiental.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">3. Implementa el Webhook</h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Copia el código generado a la derecha. Este procesa dinámicamente cada reintento de cobro fallido.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">4. Registra en Stripe Dashboard</h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Configura la URL de webhook en Stripe registrando el evento <code>invoice.payment_failed</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl bg-slate-900/40 border border-slate-900 p-4 text-xs text-slate-400 leading-relaxed space-y-2">
              <p>💡 <strong>Inteligencia de Stripe:</strong> Stripe maneja nativamente el reintento de facturas fallidas y envía el parámetro <code>invoice.attempt_count</code> en el webhook para que sepas qué paso enviar.</p>
            </div>
          </div>

          {/* Copyable Code Blocks (3 cols) */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start inline-flex">
              <button 
                onClick={() => setIntegrationLang('express')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${integrationLang === 'express' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Node.js + Express
              </button>
              <button 
                onClick={() => setIntegrationLang('nextjs')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${integrationLang === 'nextjs' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Next.js App Router
              </button>
              <button 
                onClick={() => setIntegrationLang('curl')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${integrationLang === 'curl' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                cURL de Prueba
              </button>
            </div>

            <div className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="bg-slate-900/50 px-4 py-2.5 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {integrationLang === 'express' ? 'server.js (Express)' : integrationLang === 'nextjs' ? 'route.ts (Next.js)' : 'test-webhook.sh'}
                  </span>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold px-2.5 py-1 rounded bg-violet-500/10 border border-violet-500/20 active:scale-95 transition-all"
                >
                  {copied ? '¡Copiado!' : 'Copiar Código'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed overflow-x-auto text-slate-400 max-h-[450px] overflow-y-auto whitespace-pre">
                {getCodeContent()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Email Preview & Recovery Actions */}
      {activeEmailPreview && (() => {
        const previewStepIndex = activeEmailPreview.stepIndex !== undefined 
          ? activeEmailPreview.stepIndex 
          : (payments.find(p => p.id === activeEmailPreview.id)?.retries - 1 || 0);

        const modalStep = settings.dunningSequence[previewStepIndex] || settings.dunningSequence[0];

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
            <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
              
              {/* Header modal */}
              <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/40">
                <h3 className="font-heading font-extrabold text-white text-base">
                  Previsualizar Email (Paso {modalStep.step}: {modalStep.title})
                </h3>
                <button 
                  onClick={() => setActiveEmailPreview(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Email Body Preview */}
              <div className="p-6 bg-slate-900/20 space-y-4">
                
                {/* Mock mail info header */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-900 text-xs space-y-1 text-slate-400">
                  <div><span className="font-semibold text-slate-300">De:</span> facturacion@tu-startup.com <span className="text-[10px] text-slate-600">(vía RecoverFlow)</span></div>
                  <div><span className="font-semibold text-slate-300">Para:</span> {activeEmailPreview.email}</div>
                  <div className="truncate"><span className="font-semibold text-slate-300">Asunto:</span> {modalStep.subject}</div>
                </div>

                {/* Email Content Frame */}
                <div className="bg-white rounded-xl p-8 text-slate-800 text-sm space-y-6 shadow-inner">
                  {/* Brand Logo Mockup */}
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: settings.brandColor }}
                    >
                      {settings.brandLogo}
                    </div>
                    <span className="font-bold text-slate-900">{settings.businessName}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-900 text-base">Hola {activeEmailPreview.name},</p>
                    <p className="text-slate-600 leading-relaxed font-light whitespace-pre-wrap">
                      {formatEmailBody(modalStep.body, activeEmailPreview.name, activeEmailPreview.amount)}
                    </p>
                  </div>

                  {/* Simulated Payment Update Button */}
                  <div className="text-center pt-2">
                    <button 
                      onClick={() => handleSimulateRecovery(activeEmailPreview.id, activeEmailPreview.email, activeEmailPreview.amount)}
                      className="inline-flex items-center space-x-2 px-6 py-3 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      style={{ backgroundColor: settings.brandColor }}
                    >
                      <span>{modalStep.buttonText}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                    Si tienes dudas, contáctanos a {settings.supportEmail}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 border-t border-slate-900 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-amber-400 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Simula el pago presionando el botón del correo.</span>
                </span>
                <button 
                  onClick={() => setActiveEmailPreview(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  )
}

export default Dashboard
