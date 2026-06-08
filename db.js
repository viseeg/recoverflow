import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Default sequence settings for new users
const DEFAULT_SETTINGS = {
  businessName: 'Tu Startup SaaS',
  brandColor: '#8b5cf6', // Violet color by default
  brandLogo: '🌊',
  supportEmail: 'soporte@tu-startup.com',
  dunningSequence: [
    {
      step: 1,
      title: "Aviso Amigable",
      delay: 1, // Días después del fallo
      subject: "⚠️ Acción Requerida: Tu pago mensual ha fallado",
      body: "Hola {nombre_cliente}, te escribimos porque tu banco ha rechazado el pago correspondiente a tu suscripción. El cobro de {monto} no pudo ser procesado.\n\nPor favor, actualiza tu tarjeta para seguir disfrutando de nuestro servicio.",
      buttonText: "Actualizar Tarjeta & Reintentar Pago"
    },
    {
      step: 2,
      title: "Segundo Recordatorio",
      delay: 3,
      subject: "🚨 Recordatorio: Tu suscripción está en pausa temporal",
      body: "Hola {nombre_cliente}, este es nuestro segundo intento de cobro del mes. No pudimos procesar el cargo de {monto}.\n\nHemos pausado tu acceso temporalmente. Puedes reanudarlo al instante actualizando tus datos de facturación aquí.",
      buttonText: "Reactivar mi Suscripción"
    },
    {
      step: 3,
      title: "Aviso de Suspensión",
      delay: 7,
      subject: "🚫 Alerta: Tu cuenta será suspendida definitivamente",
      body: "Hola {nombre_cliente}, hemos realizado múltiples intentos de cobro sin éxito. Tu suscripción de {monto} será cancelada definitivamente al final del día si no actualizas tu método de pago.",
      buttonText: "Evitar Cancelación & Pagar"
    }
  ]
};

// Hash a password using pbkdf2
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Helper to read JSON database file
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading database file:', error.message);
    return { users: [], clients: [] };
  }
}

// Helper to write JSON database file
async function writeDB(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Error writing to database file:', error.message);
  }
}

// Database auto-migration for old db.json structure
async function migrateOldDB(db) {
  console.log('🚧 Migrating database from single-tenant to multi-tenant...');
  const newDb = {
    users: [],
    clients: []
  };

  // Create default demo user
  const { salt, hash } = hashPassword("demo123");
  const demoUser = {
    id: "usr_demo",
    email: "demo@recoverflow.com",
    salt,
    passwordHash: hash,
    settings: db.settings || DEFAULT_SETTINGS
  };
  newDb.users.push(demoUser);

  // Migrate old clients to the demo user
  if (db.clients && Array.isArray(db.clients)) {
    newDb.clients = db.clients.map(c => ({
      ...c,
      userId: c.userId || "usr_demo"
    }));
  }

  await writeDB(newDb);
  console.log('✅ Migration completed successfully.');
}

// Initialize database file if it does not exist
export async function initDB() {
  try {
    await fs.access(DB_PATH);
    console.log('📦 Database db.json loaded successfully.');
    
    // Check if migration is needed
    const db = await readDB();
    if (!db.users || !db.clients) {
      await migrateOldDB(db);
    }
  } catch (error) {
    console.log('📝 Creating a new database file db.json with seed data...');
    const db = {
      users: [],
      clients: []
    };
    
    // Create default demo user (demo@recoverflow.com / demo123)
    const { salt, hash } = hashPassword("demo123");
    const demoUser = {
      id: "usr_demo",
      email: "demo@recoverflow.com",
      salt,
      passwordHash: hash,
      settings: DEFAULT_SETTINGS
    };
    db.users.push(demoUser);

    // Create seed clients for the demo user
    const now = Date.now();
    db.clients = [
      {
        id: "cli_1",
        userId: "usr_demo",
        name: "Carlos Delgado",
        email: "carlos@ejemplo.com",
        amount: 49,
        status: "En Proceso",
        date: new Date(now - 10 * 60000).toISOString(),
        history: [
          { status: "Fallido", timestamp: new Date(now - 10 * 60000).toISOString(), msg: "Intento de cobro fallido. Correo Paso 1 enviado." }
        ]
      },
      {
        id: "cli_2",
        userId: "usr_demo",
        name: "María Gómez",
        email: "maria@ejemplo.com",
        amount: 89,
        status: "Recuperado",
        date: new Date(now - 2 * 3600000).toISOString(),
        history: [
          { status: "Fallido", timestamp: new Date(now - 4 * 3600000).toISOString(), msg: "Intento de cobro fallido. Correo Paso 1 enviado." },
          { status: "Recuperado", timestamp: new Date(now - 2 * 3600000).toISOString(), msg: "Pago actualizado por el cliente. Recuperado." }
        ]
      },
      {
        id: "cli_3",
        userId: "usr_demo",
        name: "Alex Chen",
        email: "alex@ejemplo.com",
        amount: 129,
        status: "Reintentando",
        date: new Date(now - 1 * 86400000).toISOString(),
        history: [
          { status: "Fallido", timestamp: new Date(now - 1 * 86400000).toISOString(), msg: "Intento de cobro fallido. Correo Paso 1 enviado." }
        ]
      },
      {
        id: "cli_4",
        userId: "usr_demo",
        name: "Elena Rostova",
        email: "elena@ejemplo.com",
        amount: 199,
        status: "Fallido",
        date: new Date(now - 3 * 86400000).toISOString(),
        history: [
          { status: "Fallido", timestamp: new Date(now - 3 * 86400000).toISOString(), msg: "Intento de cobro fallido. Correo Paso 1 enviado." },
          { status: "Fallido", timestamp: new Date(now - 2 * 86400000).toISOString(), msg: "Intento de cobro fallido. Correo Paso 2 enviado." },
          { status: "Fallido", timestamp: new Date(now - 1 * 86400000).toISOString(), msg: "Intento de cobro fallido. Correo Paso 3 enviado." },
          { status: "Fallido", timestamp: new Date(now - 3 * 3600000).toISOString(), msg: "Cobros fallidos después de todos los intentos de la secuencia. Cuenta suspendida." }
        ]
      }
    ];

    await writeDB(db);
  }
}

// Register User
export async function registerUser(email, password, businessName) {
  const db = await readDB();
  const lowerEmail = email.toLowerCase().trim();
  const existing = db.users.find(u => u.email.toLowerCase() === lowerEmail);
  if (existing) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const { salt, hash } = hashPassword(password);
  const id = 'usr_' + Math.random().toString(36).substring(2, 9);
  
  const newUser = {
    id,
    email: lowerEmail,
    salt,
    passwordHash: hash,
    settings: {
      ...DEFAULT_SETTINGS,
      businessName: businessName || 'Mi Empresa SaaS',
      supportEmail: lowerEmail
    }
  };

  db.users.push(newUser);
  await writeDB(db);
  
  const { passwordHash: _, salt: __, ...userPublic } = newUser;
  return userPublic;
}

// Authenticate User
export async function authenticateUser(email, password) {
  const db = await readDB();
  const lowerEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email.toLowerCase() === lowerEmail);
  if (!user) {
    return null;
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const { passwordHash: _, salt: __, ...userPublic } = user;
  return userPublic;
}

// Get User by ID
export async function getUserById(userId) {
  const db = await readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  const { passwordHash: _, salt: __, ...userPublic } = user;
  return userPublic;
}

// Retrieve Settings per user
export async function getSettings(userId) {
  const db = await readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  return user.settings;
}

// Update Settings per user
export async function updateSettings(userId, newSettings) {
  const db = await readDB();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('Usuario no encontrado');
  }
  db.users[userIndex].settings = { ...db.users[userIndex].settings, ...newSettings };
  await writeDB(db);
  return db.users[userIndex].settings;
}

// Retrieve all clients per user
export async function getClients(userId) {
  const db = await readDB();
  return db.clients.filter(c => c.userId === userId);
}

// Retrieve stats computed dynamically for a specific user
export async function getStats(userId) {
  const db = await readDB();
  const userClients = db.clients.filter(c => c.userId === userId);
  
  const recovered = userClients
    .filter(c => c.status === 'Recuperado')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const churn = userClients
    .filter(c => c.status === 'Fallido')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Seeded mock monthly trend base updated with current month (June) dynamic metrics
  const monthlyTrend = [
    { month: "Ene", rec: 8200, lost: 1500 },
    { month: "Feb", rec: 9400, lost: 1800 },
    { month: "Mar", rec: 11200, lost: 2100 },
    { month: "Abr", rec: 10500, lost: 2400 },
    { month: "May", rec: 12850, lost: 2840 },
    { month: "Jun", rec: 0, lost: 0 }
  ];
  
  const junTrend = monthlyTrend.find(m => m.month === 'Jun');
  if (junTrend) {
    junTrend.rec = userClients
      .filter(c => c.status === 'Recuperado' && c.date.includes('-06-'))
      .reduce((acc, curr) => acc + curr.amount, 0);
    junTrend.lost = userClients
      .filter(c => c.status === 'Fallido' && c.date.includes('-06-'))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }

  // Calculate efficacy by retry step
  const efficacy = [0, 0, 0, 0];
  const recoveredClients = userClients.filter(c => c.status === 'Recuperado');
  recoveredClients.forEach(c => {
    const failCount = c.history.filter(h => h.status === 'Fallido').length;
    const index = Math.min(failCount, 3);
    efficacy[index] += 1;
  });
  
  const totalRecCount = recoveredClients.length;
  const efficacyPct = efficacy.map(v => totalRecCount > 0 ? Math.round((v / totalRecCount) * 100) : 25);

  return {
    recovered,
    churn,
    efficacy: efficacyPct,
    monthlyTrend
  };
}

// Add a new client (failed payment webhook received) per user
export async function addClient(userId, name, email, amount) {
  const db = await readDB();
  const id = 'cli_' + Math.random().toString(36).substring(2, 9);
  
  const newClient = {
    id,
    userId,
    name,
    email,
    amount: parseFloat(amount),
    status: "En Proceso",
    date: new Date().toISOString(),
    history: [
      { status: "Fallido", timestamp: new Date().toISOString(), msg: "Intento de cobro fallido. Correo Paso 1 enviado." }
    ]
  };

  db.clients.unshift(newClient); // Put at the beginning
  await writeDB(db);
  return newClient;
}

// Recover a client per user
export async function recoverClient(userId, idOrEmail) {
  const db = await readDB();
  const clientIndex = db.clients.findIndex(c => c.userId === userId && (c.id === idOrEmail || c.email === idOrEmail));
  
  if (clientIndex === -1) {
    console.log(`⚠️ Client with ID/Email ${idOrEmail} for user ${userId} not found in DB.`);
    return null;
  }

  const client = db.clients[clientIndex];
  
  if (client.status === "Recuperado") {
    return client;
  }

  client.status = "Recuperado";
  client.history.unshift({
    status: "Recuperado",
    timestamp: new Date().toISOString(),
    msg: "Pago de dunning realizado con éxito. Suscripción activa."
  });

  await writeDB(db);
  return client;
}

// Advance a client's sequence status per user
export async function advanceClientSequence(userId, id, sequenceLength) {
  const db = await readDB();
  const clientIndex = db.clients.findIndex(c => c.userId === userId && c.id === id);

  if (clientIndex === -1) {
    throw new Error('Cliente no encontrado');
  }

  const client = db.clients[clientIndex];
  
  if (client.status === "Recuperado" || client.status === "Fallido") {
    return client; // Cannot advance a finalized client
  }

  const failedAttempts = client.history.filter(h => h.status === "Fallido").length;
  const nextAttempt = failedAttempts + 1;

  if (nextAttempt > sequenceLength) {
    client.status = "Fallido";
    client.history.unshift({
      status: "Fallido",
      timestamp: new Date().toISOString(),
      msg: `Cobros fallidos después de todos los ${sequenceLength} intentos de la secuencia. Cuenta suspendida.`
    });
  } else {
    client.status = "Reintentando";
    client.history.unshift({
      status: "Fallido",
      timestamp: new Date().toISOString(),
      msg: `Intento de cobro fallido. Correo Paso ${nextAttempt} enviado.`
    });
  }

  await writeDB(db);
  return client;
}
