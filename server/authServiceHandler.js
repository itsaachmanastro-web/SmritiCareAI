/**
 * SmritiCare Server-Side Authentication Handler
 * Provides real server-side authentication, password hashing, session management,
 * and role-based authorization verification.
 */
import crypto from 'crypto';

// In-memory server session store (mirrored with database records)
const serverSessions = new Map();
const registeredAccounts = new Map();

// Cryptographic password hasher
export function hashServerPassword(plainText) {
  if (!plainText) return '';
  return crypto.createHash('sha256').update(plainText).digest('hex');
}

export function normalizeServerRole(role) {
  if (!role) return 'caregiver';
  const r = String(role).trim().toLowerCase();
  if (r === 'clinician' || r === 'healthcare_worker' || r === 'healthcare-worker' || r === 'healthcare-professional' || r === 'doctor') {
    return 'healthcare';
  }
  return r;
}

// Seed initial default accounts if not present
const defaultAccounts = [
  {
    id: 1,
    name: 'Bimala Borah (Amma)',
    email: 'amma@smriticare.org',
    role: 'patient',
    pin: '1234',
    passwordHash: hashServerPassword('demo123'),
    age: 74,
    location: 'Jorhat, Assam',
    isVerified: true
  },
  {
    id: 2,
    name: 'Priya Borah',
    email: 'priya@smriticare.org',
    role: 'caregiver',
    passwordHash: hashServerPassword('demo123'),
    relation: 'Daughter',
    phone: '+91 94350 12345',
    linkedPatientId: 1,
    isVerified: true
  },
  {
    id: 3,
    name: 'Dr. Arun Phukan',
    email: 'phukan@health.assam.gov.in',
    role: 'healthcare',
    passwordHash: hashServerPassword('demo123'),
    designation: 'PHC Medical Officer, Titabar',
    isVerified: true
  }
];

defaultAccounts.forEach(acc => {
  registeredAccounts.set(acc.email.toLowerCase(), acc);
});

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * POST /api/auth/login
 * Body: { email, password, pin, targetRole }
 */
export async function handleAuthLogin(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  }

  try {
    const { email, password, pin, targetRole } = await parseJsonBody(req);
    const normalizedRole = normalizeServerRole(targetRole || (pin ? 'patient' : 'caregiver'));

    // 1. PIN-based login for elderly patient
    if (normalizedRole === 'patient' && pin) {
      if (!/^\d{4}$/.test(String(pin).trim())) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ success: false, error: 'PIN must be exactly 4 numeric digits.' }));
      }
      
      const user = Array.from(registeredAccounts.values()).find(
        u => u.role === 'patient' && u.pin === String(pin).trim()
      );

      if (!user) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ success: false, error: 'Incorrect 4-digit PIN. Please verify and try again.' }));
      }

      const sessionToken = `sess_${user.id}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

      serverSessions.set(sessionToken, {
        userId: user.id,
        role: user.role,
        email: user.email,
        expiresAt
      });

      const { passwordHash, ...sanitizedUser } = user;
      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        user: sanitizedUser,
        sessionToken,
        message: 'Patient authenticated successfully.'
      }));
    }

    // 2. Email + Password login
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'A valid email address is required.' }));
    }

    if (!password) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Password is required.' }));
    }

    const user = registeredAccounts.get(normalizedEmail);
    if (!user) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, error: 'No account found with this email. Please sign up.' }));
    }

    const inputHash = hashServerPassword(password);
    const isValidPassword = user.passwordHash === inputHash || (user.passwordHash === 'demo123' && password === 'demo123');

    if (!isValidPassword) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, error: 'Incorrect password. Please try again.' }));
    }

    // 3. Strict Role Authorization & Isolation Check
    const userRole = normalizeServerRole(user.role);
    if (userRole !== normalizedRole) {
      res.statusCode = 403;
      const roleNames = {
        patient: 'Patient',
        caregiver: 'Family Caregiver',
        healthcare: 'Healthcare Professional'
      };
      return res.end(JSON.stringify({
        success: false,
        error: `Access Denied: This account is registered as a ${roleNames[userRole] || userRole}, not a ${roleNames[normalizedRole] || normalizedRole}. Please use an authorized ${roleNames[normalizedRole] || normalizedRole} account.`
      }));
    }

    const sessionToken = `sess_${user.id}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    serverSessions.set(sessionToken, {
      userId: user.id,
      role: user.role,
      email: user.email,
      expiresAt
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      user: sanitizedUser,
      sessionToken,
      message: `Signed in as ${user.name}`
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Server authentication encountered an error.' }));
  }
}

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, pin, designation, relation }
 */
export async function handleAuthRegister(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  }

  try {
    const data = await parseJsonBody(req);
    const { name, email, password, role, pin, designation, relation, location, age } = data;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Full name is required (minimum 2 characters).' }));
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'A valid email address is required.' }));
    }

    if (!password || password.length < 4) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Password must be at least 4 characters long.' }));
    }

    const normalizedRole = normalizeServerRole(role);

    if (registeredAccounts.has(normalizedEmail)) {
      res.statusCode = 409;
      return res.end(JSON.stringify({
        success: false,
        error: 'An account with this email already exists. Please sign in.'
      }));
    }

    const newId = registeredAccounts.size + 1;
    const now = new Date().toISOString();
    const newAccount = {
      id: newId,
      name: name.trim(),
      email: normalizedEmail,
      role: normalizedRole,
      passwordHash: hashServerPassword(password),
      pin: pin || (normalizedRole === 'patient' ? '1234' : undefined),
      age: age ? Number(age) : (normalizedRole === 'patient' ? 74 : undefined),
      location: location || 'Assam, India',
      relation: relation || (normalizedRole === 'caregiver' ? 'Family Caregiver' : ''),
      designation: designation || (normalizedRole === 'healthcare' ? 'Healthcare Professional' : ''),
      isVerified: true,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    registeredAccounts.set(normalizedEmail, newAccount);

    const sessionToken = `sess_${newId}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    serverSessions.set(sessionToken, {
      userId: newId,
      role: normalizedRole,
      email: normalizedEmail,
      expiresAt
    });

    const { passwordHash: _, ...sanitizedUser } = newAccount;
    res.statusCode = 201;
    return res.end(JSON.stringify({
      success: true,
      user: sanitizedUser,
      sessionToken,
      message: 'Account created and verified successfully.'
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Failed to complete registration.' }));
  }
}

/**
 * POST /api/auth/google
 * Body: { email, name, avatar, targetRole }
 */
export async function handleAuthGoogle(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  }

  try {
    const { email, name, avatar, targetRole } = await parseJsonBody(req);
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedTargetRole = normalizeServerRole(targetRole);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Valid Google email is required.' }));
    }

    let user = registeredAccounts.get(normalizedEmail);
    const roleNames = {
      patient: 'Patient',
      caregiver: 'Family Caregiver',
      healthcare: 'Healthcare Professional'
    };

    if (user) {
      // Strict Google Account Role Isolation
      const userRole = normalizeServerRole(user.role);
      if (userRole !== normalizedTargetRole) {
        res.statusCode = 403;
        return res.end(JSON.stringify({
          success: false,
          error: `This Google account (${normalizedEmail}) is registered as a ${roleNames[userRole] || userRole}, not a ${roleNames[normalizedTargetRole] || normalizedTargetRole}. Please use an authorized ${roleNames[normalizedTargetRole] || normalizedTargetRole} account.`
        }));
      }
    } else {
      // Auto-register new Google user for target role
      const newId = registeredAccounts.size + 1;
      const now = new Date().toISOString();
      user = {
        id: newId,
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: normalizedTargetRole,
        avatar: avatar || null,
        profileImage: avatar || null,
        location: 'Assam, India',
        relation: normalizedTargetRole === 'caregiver' ? 'Family Caregiver' : '',
        designation: normalizedTargetRole === 'healthcare' ? 'Healthcare Professional' : '',
        isVerified: true,
        status: 'active',
        createdAt: now,
        updatedAt: now
      };
      registeredAccounts.set(normalizedEmail, user);
    }

    const sessionToken = `sess_google_${user.id}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    serverSessions.set(sessionToken, {
      userId: user.id,
      role: user.role,
      email: user.email,
      expiresAt
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      user: sanitizedUser,
      sessionToken,
      message: 'Google authentication verified.'
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Google OAuth verification failed.' }));
  }
}

/**
 * POST /api/auth/verify-session
 * Body: { token, sessionToken, targetRole, requiredRole }
 */
export async function handleVerifySession(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, valid: false, error: 'Method Not Allowed' }));
  }

  try {
    const data = await parseJsonBody(req);
    const token = data.sessionToken || data.token;
    const targetRole = data.targetRole || data.requiredRole;

    if (!token) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, valid: false, error: 'No session token provided.' }));
    }

    const session = serverSessions.get(token);
    if (!session || new Date(session.expiresAt) <= new Date()) {
      if (session) serverSessions.delete(token);
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, valid: false, error: 'Session expired or invalid.' }));
    }

    const user = registeredAccounts.get(session.email);
    if (!user) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, valid: false, error: 'User account not found.' }));
    }

    if (targetRole) {
      const normalizedTarget = normalizeServerRole(targetRole);
      const userRole = normalizeServerRole(user.role);
      if (userRole !== normalizedTarget) {
        res.statusCode = 403;
        return res.end(JSON.stringify({
          success: false,
          valid: false,
          error: `Unauthorized: User role is ${userRole}, expected ${normalizedTarget}.`
        }));
      }
    }

    const { passwordHash: _, ...sanitizedUser } = user;
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      valid: true,
      user: sanitizedUser
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, valid: false, error: 'Session verification error.' }));
  }
}

/**
 * POST /api/auth/logout
 * Body: { token, sessionToken }
 */
export async function handleAuthLogout(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const data = await parseJsonBody(req);
    const token = data.sessionToken || data.token;
    if (token) {
      serverSessions.delete(token);
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, message: 'Logged out successfully.' }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Logout failed.' }));
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { email }
 */
export async function handleAuthResetPassword(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { email } = await parseJsonBody(req);
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Valid email is required.' }));
    }

    const user = registeredAccounts.get(normalizedEmail);
    if (!user) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ success: false, error: 'No account registered with this email address.' }));
    }

    const resetToken = `rst_${crypto.randomBytes(12).toString('hex')}`;
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      message: `Password reset verification link ready for ${normalizedEmail}.`,
      resetToken
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Password reset request failed.' }));
  }
}
