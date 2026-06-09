import express from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  initDB, 
  getClients, 
  getStats, 
  getSettings, 
  updateSettings, 
  addClient, 
  recoverClient, 
  advanceClientSequence,
  registerUser,
  authenticateUser,
  getUserById
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environmental variables or defaults
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_key';
const resendApiKey = process.env.RESEND_API_KEY || 're_mock_key';

const stripe = new Stripe(stripeSecretKey);
const resend = new Resend(resendApiKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database on Startup
await initDB();

// Helper to generate simple Base64 token for multi-tenant sessions without external libraries
function generateToken(user) {
  return Buffer.from(`${user.id}:${user.email}`).toString('base64');
}

function verifyTokenAndGetUserId(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, email] = decoded.split(':');
    if (id && email) {
      return id;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Authentication Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de sesión requerido.' });
  }

  const token = authHeader.split(' ')[1];
  const userId = verifyTokenAndGetUserId(token);
  if (!userId) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }
    req.userId = userId;
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 1. Stripe Webhooks Multi-tenant (Requires raw body parsing, MUST be defined BEFORE app.use(express.json()))
app.post('/api/webhook/:userId', express.raw({ type: 'application/json' }), async (req, res) => {
  const { userId } = req.params;
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const user = await getUserById(userId);
    if (!user) {
      console.error(`❌ Webhook received for non-existing user: ${userId}`);
      return res.status(404).send('User not found');
    }

    if (stripeWebhookSecret !== 'whsec_mock_key' && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } else {
      console.log(`⚠️ Stripe signature verification bypassed for user ${userId}. Running in Sandbox / Test mode.`);
      event = JSON.parse(req.body.toString());
    }

    console.log(`🔌 Webhook event received for user ${userId}: ${event.type}`);

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      const customerName = invoice.customer_name || 'Cliente';
      const amount = (invoice.amount_due / 100).toFixed(2);

      // Persist in DB for this user
      await addClient(userId, customerName, customerEmail, amount);

      // Load active settings
      const settings = user.settings;
      const attemptCount = invoice.attempt_count || 1;
      const sequence = settings.dunningSequence || [];
      const step = sequence.find(s => s.step === attemptCount) || sequence[0];

      if (step) {
        const bodyFormatted = step.body
          .replace(/{nombre_cliente}/g, customerName)
          .replace(/{monto}/g, `$${amount} USD`);

        console.log(`📧 Sending recovery email (Paso ${step.step}) to ${customerEmail}...`);

        try {
          if (resendApiKey === 're_mock_key') {
            console.log('⚠️ Mocking email send via Resend. Configure RESEND_API_KEY for real delivery.');
          } else {
            await resend.emails.send({
              from: `${settings.businessName} <onboarding@resend.dev>`,
              to: customerEmail,
              subject: step.subject,
              html: `
                <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; color: #1e293b;">
                  <div style="display: flex; align-items: center; margin-bottom: 24px;">
                    <div style="width: 36px; height: 36px; background-color: ${settings.brandColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 10px;">
                      ${settings.brandLogo}
                    </div>
                    <span style="font-weight: bold; font-size: 18px; color: #0f172a;">${settings.businessName}</span>
                  </div>
                  <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola ${customerName},</p>
                  <p style="font-size: 14px; line-height: 1.6; color: #475569; white-space: pre-wrap; margin-bottom: 24px;">${bodyFormatted}</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${invoice.hosted_invoice_url || '#'}" style="background-color: ${settings.brandColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      ${step.buttonText}
                    </a>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                    Si tienes dudas, contáctanos a ${settings.supportEmail}
                  </p>
                </div>
              `
            });
            console.log(`✅ Email successfully sent to ${customerEmail}!`);
          }
        } catch (emailErr) {
          console.error(`❌ Failed to send email via Resend: ${emailErr.message}`);
        }
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      console.log(`✅ Stripe webhook reports payment succeeded for ${customerEmail}. Updating database.`);
      await recoverClient(userId, customerEmail);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`❌ Webhook processing error: ${err.message}`);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
});

// Legacy single webhook routing (for backward compatibility, defaults to usr_demo)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  req.url = '/api/webhook/usr_demo';
  app.handle(req, res);
});

// 2. Parse JSON bodies for REST API routes
app.use(express.json());

// 3. Auth REST API Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, businessName } = req.body;
  console.log(`🔐 [Register] Attempt for email: ${email}`);
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }
  
  try {
    const user = await registerUser(email, password, businessName);
    const token = generateToken(user);
    console.log(`✅ [Register] Success! User created: ${user.id} (${user.email})`);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(`❌ [Register] Failed for ${email}: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 [Login] Attempt for email: ${email}`);
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }
  
  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      console.error(`❌ [Login] Failed for ${email}: user not found or password mismatch`);
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const token = generateToken(user);
    console.log(`✅ [Login] Success! User: ${user.id} (${user.email})`);
    res.json({ user, token });
  } catch (err) {
    console.error(`❌ [Login] Error for ${email}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// 4. Client-Server Protected REST API Routes
app.get('/api/clients', authenticate, async (req, res) => {
  try {
    const clients = await getClients(req.userId);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const stats = await getStats(req.userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', authenticate, async (req, res) => {
  try {
    const settings = await getSettings(req.userId);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authenticate, async (req, res) => {
  try {
    const updated = await updateSettings(req.userId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate failed payment webhook (Paso 1)
app.post('/api/simulate-webhook', authenticate, async (req, res) => {
  const { name, email, amount } = req.body;
  const userId = req.userId;
  let emailStatus = 'skipped';
  let emailMessage = 'RESEND_API_KEY no configurada. Usando clave mock — no se envían correos reales.';
  
  try {
    const newClient = await addClient(userId, name, email, amount);
    console.log(`🔌 [Simulation Webhook] invoice.payment_failed created for user ${userId}: ${name} (${email}) - $${amount}`);
    
    // Load active settings
    const settings = await getSettings(userId);
    const sequence = settings.dunningSequence || [];
    const step = sequence.find(s => s.step === 1) || sequence[0]; // Step 1

    if (step) {
      const bodyFormatted = step.body
        .replace(/{nombre_cliente}/g, name)
        .replace(/{monto}/g, `$${amount} USD`);

      console.log(`📧 [Simulated Email] Dispatching dunning email (Paso 1) to ${email}...`);
      console.log(`🔑 [Debug] RESEND_API_KEY is: ${resendApiKey === 're_mock_key' ? 'MOCK (not configured)' : 'REAL (configured, starts with ' + resendApiKey.substring(0, 8) + '...)'}`);

      if (resendApiKey !== 're_mock_key') {
        try {
          const resendResponse = await resend.emails.send({
            from: `${settings.businessName} <onboarding@resend.dev>`,
            to: email,
            subject: step.subject,
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; color: #1e293b;">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 36px; height: 36px; background-color: ${settings.brandColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 10px;">
                    ${settings.brandLogo}
                  </div>
                  <span style="font-weight: bold; font-size: 18px; color: #0f172a;">${settings.businessName}</span>
                </div>
                <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola ${name},</p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; white-space: pre-wrap; margin-bottom: 24px;">${bodyFormatted}</p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="background-color: ${settings.brandColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                    ${step.buttonText}
                  </span>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                  Si tienes dudas, contáctanos a ${settings.supportEmail}
                </p>
              </div>
            `
          });
          console.log(`✅ [Simulated Email] Resend successfully dispatched email to ${email}!`, resendResponse);
          emailStatus = 'sent';
          emailMessage = `Correo enviado exitosamente a ${email} via Resend (ID: ${resendResponse?.data?.id || 'unknown'})`;
        } catch (errEmail) {
          console.error(`❌ [Simulated Email] Resend failed to send:`, errEmail);
          emailStatus = 'error';
          emailMessage = `Error de Resend: ${errEmail.message}`;
        }
      } else {
        console.log('⚠️ [Simulated Email] RESEND_API_KEY is mock. Skipping real email send.');
      }
    }

    res.json({ ...newClient, emailStatus, emailMessage });
  } catch (err) {
    console.error('❌ Error processing simulated webhook:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Advance client in the sequence (Simulate next retry)
app.post('/api/clients/:id/advance', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  
  try {
    const settings = await getSettings(userId);
    const sequence = settings.dunningSequence || [];
    
    // Advance the client status in the database
    const updatedClient = await advanceClientSequence(userId, id, sequence.length);
    
    // Determine the current attempt count
    const attemptCount = updatedClient.history.filter(h => h.status === "Fallido").length;
    
    console.log(`🔌 [Simulation Retry] Client ${updatedClient.name} advanced to attempt ${attemptCount}/${sequence.length} for user ${userId}`);

    // If client hasn't failed permanently, get and log the email step details
    const step = sequence.find(s => s.step === attemptCount);
    
    if (updatedClient.status !== 'Fallido' && step) {
      console.log(`📧 [Simulated Email] Dispatching dunning email (Paso ${attemptCount}) to ${updatedClient.email}...`);
      
      const bodyFormatted = step.body
        .replace(/{nombre_cliente}/g, updatedClient.name)
        .replace(/{monto}/g, `$${updatedClient.amount} USD`);

      if (resendApiKey !== 're_mock_key') {
        try {
          await resend.emails.send({
            from: `${settings.businessName} <onboarding@resend.dev>`,
            to: updatedClient.email,
            subject: step.subject,
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; color: #1e293b;">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 36px; height: 36px; background-color: ${settings.brandColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 10px;">
                    ${settings.brandLogo}
                  </div>
                  <span style="font-weight: bold; font-size: 18px; color: #0f172a;">${settings.businessName}</span>
                </div>
                <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola ${updatedClient.name},</p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; white-space: pre-wrap; margin-bottom: 24px;">${bodyFormatted}</p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="background-color: ${settings.brandColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                    ${step.buttonText}
                  </span>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                  Si tienes dudas, contáctanos a ${settings.supportEmail}
                </p>
              </div>
            `
          });
          console.log(`✅ [Simulated Email] Resend successfully dispatched step ${attemptCount} email!`);
        } catch (errEmail) {
          console.error(`❌ [Simulated Email] Resend failed to send step ${attemptCount} email: ${errEmail.message}`);
        }
      }
    } else if (updatedClient.status === 'Fallido') {
      console.log(`🚫 [Simulation Retry] Client ${updatedClient.name} reached max attempts. Subscription cancelled permanently.`);
    }

    res.json({ client: updatedClient, step: step || null });
  } catch (err) {
    console.error('❌ Error processing simulated sequence advancement:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients/recover', authenticate, async (req, res) => {
  const { clientId } = req.body;
  const userId = req.userId;
  
  try {
    const updatedClient = await recoverClient(userId, clientId);
    if (updatedClient) {
      console.log(`✅ [Simulation Recovery] Client ${updatedClient.name} successfully updated to "Recuperado" for user ${userId}`);
      res.json(updatedClient);
    } else {
      res.status(404).json({ error: 'Client not found in database' });
    }
  } catch (err) {
    console.error('❌ Error processing simulated recovery:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Serve Vite compiled production build folder
app.use(express.static(path.join(__dirname, 'dist')));

// 6. Fallback index.html router for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌊 RecoverFlow Server running at http://localhost:${PORT}`);
  console.log(`🔌 Webhook endpoint base: http://localhost:${PORT}/api/webhook/:userId`);
});
