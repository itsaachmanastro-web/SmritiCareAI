import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, seedDatabaseIfEmpty, initializeDatabase, ensureDemoUsers } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { setAppMode } from '../config/appMode';

export function normalizeRole(role) {
  if (!role) return 'caregiver';
  const r = String(role).trim().toLowerCase();
  if (r === 'clinician' || r === 'healthcare_worker' || r === 'healthcare-worker' || r === 'healthcare-professional' || r === 'doctor') {
    return 'healthcare';
  }
  return r;
}

const AuthContext = createContext();

// Lightweight SHA-256 password hasher using standard browser Web Crypto API
async function hashPassword(plainText) {
  if (!plainText) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return plainText; // graceful fallback in older testing environments
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to synchronize a Supabase OAuth session user with server & Dexie DB
  const syncSupabaseSessionToDexie = async (supaUser) => {
    if (!supaUser) return null;
    const email = supaUser.email?.toLowerCase();
    const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email?.split('@')[0] || 'User';
    const avatar = supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture || null;
    const targetRole = localStorage.getItem('smriti_oauth_role') || 'caregiver';
    localStorage.removeItem('smriti_oauth_role');

    // 1. First try server verification to enforce role isolation
    try {
      const srvRes = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar, targetRole })
      });
      const srvData = await srvRes.json();
      if (!srvRes.ok || !srvData.success) {
        throw new Error(srvData.error || 'Google authentication was rejected for this role.');
      }

      const verifiedUser = srvData.user;
      const sessionToken = srvData.sessionToken;

      await initializeDatabase();
      let existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
      const now = new Date().toISOString();

      if (!existingUser) {
        const userRecord = {
          ...verifiedUser,
          passwordHash: '',
          profileImage: avatar,
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now
        };
        const newId = await db.users.add(userRecord);
        existingUser = { id: newId, ...userRecord };
      } else {
        const updates = { lastLoginAt: now, updatedAt: now };
        if (!existingUser.profileImage && avatar) updates.profileImage = avatar;
        if (!existingUser.name && name) updates.name = name;
        await db.users.update(existingUser.id, updates);
        existingUser = { ...existingUser, ...updates };
      }

      await db.sessions.add({
        userId: existingUser.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        createdAt: now
      });

      localStorage.setItem('smriti_session_token', sessionToken);
      localStorage.setItem('smriti_user_id', String(existingUser.id));
      localStorage.setItem('smriti_user', JSON.stringify(existingUser));
      setAppMode('production');

      return existingUser;
    } catch (err) {
      console.warn('Server OAuth sync notice:', err.message);
      // If error is explicit role mismatch rejection, rethrow
      if (err.message.includes('registered as') || err.message.includes('Access Denied')) {
        throw err;
      }

      // Offline fallback: Validate in Dexie
      await initializeDatabase();
      let existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
    const normalizedTarget = normalizeRole(targetRole);
      const now = new Date().toISOString();

      if (existingUser && existingUser.role !== normalizedTarget) {
        const currentRoleName = existingUser.role === 'healthcare' ? 'Healthcare Worker' : existingUser.role.charAt(0).toUpperCase() + existingUser.role.slice(1);
        const targetRoleName = normalizedTarget === 'healthcare' ? 'Healthcare Worker' : normalizedTarget.charAt(0).toUpperCase() + normalizedTarget.slice(1);
        throw new Error(`Access Denied: This Google account is registered as a ${currentRoleName}, not a ${targetRoleName}. Please sign in via ${currentRoleName} login.`);
      }

      if (!existingUser) {
        const userRecord = {
          name,
          email,
          role: normalizedTarget,
          passwordHash: '',
          avatar,
          profileImage: avatar,
          location: 'Assam, India',
          relation: normalizedTarget === 'caregiver' ? 'Family Caregiver' : '',
          designation: normalizedTarget === 'healthcare' ? 'Healthcare Professional' : '',
          isDemo: false,
          isVerified: true,
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now
        };
        const newId = await db.users.add(userRecord);
        existingUser = { id: newId, ...userRecord };
      } else {
        const updates = { lastLoginAt: now, updatedAt: now };
        if (!existingUser.profileImage && avatar) updates.profileImage = avatar;
        if (!existingUser.name && name) updates.name = name;
        await db.users.update(existingUser.id, updates);
        existingUser = { ...existingUser, ...updates };
      }

      const sessionToken = `sess_oauth_${existingUser.id}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
      await db.sessions.add({
        userId: existingUser.id,
        token: sessionToken,
        expiresAt,
        createdAt: now
      });

      localStorage.setItem('smriti_session_token', sessionToken);
      localStorage.setItem('smriti_user_id', String(existingUser.id));
      localStorage.setItem('smriti_user', JSON.stringify(existingUser));
      setAppMode('production');

      return existingUser;
    }
  };

  // App startup: Initialize database & verify/restore active session
  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    // Listen to Supabase auth events (e.g. returning from Google OAuth redirect)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
            try {
              const user = await syncSupabaseSessionToDexie(session.user);
              if (user && isMounted) {
                setCurrentUser(user);
                setIsLoading(false);
              }
            } catch (authSyncErr) {
              console.warn('Failed to sync auth state change:', authSyncErr);
            }
          }
        });
        authSubscription = subscription;
      } catch (subErr) {
        console.warn('Supabase onAuthStateChange registration error:', subErr);
      }
    }

    async function initAndRestoreSession() {
      try {
        await initializeDatabase();

        // 0. Attempt Supabase OAuth session restoration if redirected back
        if (isSupabaseConfigured() && supabase) {
          try {
            const { data: { session: supaSession } } = await supabase.auth.getSession();
            if (supaSession?.user) {
              const user = await syncSupabaseSessionToDexie(supaSession.user);
              if (user && isMounted) {
                setCurrentUser(user);
                setIsLoading(false);
                return;
              }
            }
          } catch (supaErr) {
            console.warn('Supabase OAuth restoration notice:', supaErr);
          }
        }

        // 1. Verify session token with backend API
        const savedToken = localStorage.getItem('smriti_session_token');
        if (savedToken) {
          try {
            const res = await fetch('/api/auth/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionToken: savedToken })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.user && isMounted) {
                setCurrentUser(data.user);
                setIsLoading(false);
                return;
              }
            }
          } catch {
            // Server offline, fall through to Dexie verification
          }

          // Dexie session verification
          const session = await db.sessions.where('token').equals(savedToken).first();
          if (session && new Date(session.expiresAt) > new Date()) {
            const user = await db.users.get(session.userId);
            if (user && isMounted) {
              setCurrentUser(user);
              setIsLoading(false);
              return;
            }
          }

          // Expired or invalid session
          localStorage.removeItem('smriti_session_token');
          localStorage.removeItem('smriti_user_id');
        }

        // 2. Fallback restoration using persisted user ID if verified in Dexie
        const savedUserId = localStorage.getItem('smriti_user_id');
        if (savedUserId) {
          const user = await db.users.get(Number(savedUserId));
          if (user && isMounted) {
            setCurrentUser(user);
            setIsLoading(false);
            return;
          }
        }

        // 3. Fallback from cached user JSON if verified against Dexie
        const savedUserJson = localStorage.getItem('smriti_user');
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson);
            if (parsed?.id) {
              const verified = await db.users.get(parsed.id);
              if (verified && isMounted) {
                setCurrentUser(verified);
                setIsLoading(false);
                return;
              }
            }
          } catch {
            localStorage.removeItem('smriti_user');
          }
        }

        if (isMounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Failed to initialize auth session:', err);
        if (isMounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    }

    initAndRestoreSession();

    return () => {
      isMounted = false;
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // REGISTER NEW USER FLOW (Server API + Dexie Sync)
  const register = async ({
    name,
    email,
    password,
    role = 'caregiver',
    pin = '',
    age,
    location = 'Assam, India',
    phone = '',
    relation = '',
    designation = ''
  }) => {
    // 1. Validation
    if (!name || !name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (role !== 'patient' && (!password || password.length < 4)) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }
    if (role === 'patient' && pin && pin.length !== 4) {
      return { success: false, error: 'PIN must be exactly 4 digits.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    // 2. Try Server Registration First
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
          role: normalizedRole,
          pin,
          age,
          location,
          phone,
          relation,
          designation
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      // Sync registered user to local Dexie
      await initializeDatabase();
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      let localUser = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();
      if (!localUser) {
        const userRecord = {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          passwordHash,
          pin: pin || (normalizedRole === 'patient' ? '1234' : undefined),
          avatar: null,
          profileImage: null,
          age: age ? Number(age) : (normalizedRole === 'patient' ? 74 : undefined),
          location,
          phone,
          relation: relation || (normalizedRole === 'caregiver' ? 'Family Caregiver' : ''),
          designation: designation || (normalizedRole === 'healthcare' ? 'PHC Medical Officer' : ''),
          isDemo: false,
          isVerified: true,
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now
        };
        const newId = await db.users.add(userRecord);
        localUser = { id: newId, ...userRecord };
      }

      localStorage.setItem('smriti_session_token', data.sessionToken);
      localStorage.setItem('smriti_user_id', String(localUser.id || data.user.id));
      localStorage.setItem('smriti_user', JSON.stringify(localUser));
      setAppMode('production');

      setCurrentUser(localUser);
      console.log(`✅ User registered via server: ${data.user.name} (${data.user.email})`);
      return { success: true, user: localUser };
    } catch (serverErr) {
      console.warn('Server registration unavailable, falling back to local Dexie:', serverErr.message);

      // Offline Dexie Registration Fallback
      try {
        await initializeDatabase();
        const existing = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();
        if (existing) {
          return { success: false, error: 'An account with this email already exists. Please sign in.' };
        }

        const passwordHash = await hashPassword(password);
        const now = new Date().toISOString();

        const result = await db.transaction('rw', [db.users, db.patientProfiles, db.sessions, db.syncQueue], async () => {
          const userRecord = {
            name: name.trim(),
            email: normalizedEmail,
            role: normalizedRole,
            passwordHash,
            pin: pin || (normalizedRole === 'patient' ? '1234' : undefined),
            avatar: null,
            profileImage: null,
            age: age ? Number(age) : (normalizedRole === 'patient' ? 74 : undefined),
            location,
            phone,
            relation: relation || (normalizedRole === 'caregiver' ? 'Family Caregiver' : ''),
            designation: designation || (normalizedRole === 'healthcare' ? 'PHC Medical Officer' : ''),
            isDemo: false,
            isVerified: true,
            status: 'active',
            lastLoginAt: now,
            createdAt: now,
            updatedAt: now
          };

          const userId = await db.users.add(userRecord);
          const newUser = { id: userId, ...userRecord };

          if (normalizedRole === 'patient') {
            await db.patientProfiles.add({
              userId,
              isDemo: false,
              name: newUser.name,
              age: newUser.age || 74,
              location: newUser.location,
              phcCenter: 'Titabar PHC, Assam',
              createdAt: now,
              updatedAt: now
            });
          }

          const sessionToken = `sess_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

          await db.sessions.add({
            userId,
            token: sessionToken,
            expiresAt,
            createdAt: now
          });

          return { newUser, sessionToken };
        });

        localStorage.setItem('smriti_session_token', result.sessionToken);
        localStorage.setItem('smriti_user_id', String(result.newUser.id));
        localStorage.setItem('smriti_user', JSON.stringify(result.newUser));
        setAppMode('production');

        setCurrentUser(result.newUser);
        return { success: true, user: result.newUser };
      } catch (err) {
        console.error('❌ Dexie registration failed:', err);
        return { success: false, error: err.message || 'Registration failed. Please try again.' };
      }
    }
  };

  // LOGIN WITH EMAIL FLOW (Strict Target Role Verification)
  const loginWithEmail = async (email, password, targetRole = 'caregiver') => {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedTarget = normalizeRole(targetRole);

    // 1. Try Server-Side Authentication & Authorization
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          targetRole: normalizedTarget
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }

      // Sync authenticated user to local Dexie
      await initializeDatabase();
      let localUser = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();
      const now = new Date().toISOString();

      if (!localUser) {
        const userRecord = {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          passwordHash: await hashPassword(password),
          pin: data.user.pin,
          avatar: data.user.avatar || null,
          profileImage: data.user.profileImage || null,
          location: data.user.location || 'Assam, India',
          relation: data.user.relation || '',
          designation: data.user.designation || '',
          isDemo: false,
          isVerified: true,
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now
        };
        const newId = await db.users.add(userRecord);
        localUser = { id: newId, ...userRecord };
      } else {
        await db.users.update(localUser.id, { lastLoginAt: now, updatedAt: now });
        localUser = { ...localUser, lastLoginAt: now, updatedAt: now };
      }

      localStorage.setItem('smriti_session_token', data.sessionToken);
      localStorage.setItem('smriti_user_id', String(localUser.id || data.user.id));
      localStorage.setItem('smriti_user', JSON.stringify(localUser));
      setAppMode(localUser.isDemo ? 'demo' : 'production');

      setCurrentUser(localUser);
      console.log(`✅ Authenticated via server: ${localUser.name} [role: ${localUser.role}]`);
      return { success: true, user: localUser };
    } catch (serverErr) {
      console.warn('Server auth endpoint unavailable, falling back to local Dexie:', serverErr.message);

      // Offline Dexie Verification Fallback
      try {
        await initializeDatabase();
        const user = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();

        if (!user) {
          return { success: false, error: 'No account found with this email address. Please sign up.' };
        }

        // STRICT ROLE ENFORCEMENT
        if (normalizedTarget && user.role !== normalizedTarget) {
          const currentRoleName = user.role === 'healthcare' ? 'Healthcare Worker' : user.role.charAt(0).toUpperCase() + user.role.slice(1);
          const targetRoleName = normalizedTarget === 'healthcare' ? 'Healthcare Worker' : normalizedTarget.charAt(0).toUpperCase() + normalizedTarget.slice(1);
          return {
            success: false,
            error: `Access Denied: This account is registered as a ${currentRoleName}, not a ${targetRoleName}. Please sign in via the ${currentRoleName} login screen.`
          };
        }

        // Verify password
        const inputHash = await hashPassword(password);
        const isPasswordValid =
          user.passwordHash === inputHash ||
          user.passwordHash === password ||
          (user.passwordHash === 'demo123' && password === 'demo123');

        if (!isPasswordValid) {
          return { success: false, error: 'Incorrect password. Please verify and try again.' };
        }

        const now = new Date().toISOString();
        await db.users.update(user.id, { lastLoginAt: now, updatedAt: now });
        user.lastLoginAt = now;

        const sessionToken = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

        await db.sessions.add({
          userId: user.id,
          token: sessionToken,
          expiresAt,
          createdAt: now
        });

        localStorage.setItem('smriti_session_token', sessionToken);
        localStorage.setItem('smriti_user_id', String(user.id));
        localStorage.setItem('smriti_user', JSON.stringify(user));
        setAppMode(user.isDemo ? 'demo' : 'production');

        setCurrentUser(user);
        return { success: true, user };
      } catch (err) {
        console.error('❌ Dexie login error:', err);
        return { success: false, error: err.message || 'Login failed. Please try again.' };
      }
    }
  };

  // LOGIN WITH PIN FLOW (Patient Senior Access)
  const loginWithPin = async (enteredPin, targetRole = 'patient') => {
    if (!enteredPin || enteredPin.length !== 4) {
      return { success: false, error: 'Please enter a 4-digit numeric PIN.' };
    }

    // 1. Try Server-Side PIN Authentication
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: String(enteredPin).trim(),
          targetRole: 'patient'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Incorrect PIN. Try 1234 or tap instant demo.' };
      }

      // Sync authenticated patient to local Dexie
      await initializeDatabase();
      let localUser = await db.users.where('email').equalsIgnoreCase(data.user.email).first();
      const now = new Date().toISOString();

      if (!localUser) {
        const userRecord = {
          name: data.user.name,
          email: data.user.email,
          role: 'patient',
          passwordHash: '',
          pin: String(enteredPin).trim(),
          avatar: data.user.avatar || null,
          profileImage: data.user.profileImage || null,
          age: data.user.age || 74,
          location: data.user.location || 'Assam, India',
          isDemo: false,
          isVerified: true,
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now
        };
        const newId = await db.users.add(userRecord);
        localUser = { id: newId, ...userRecord };
      } else {
        await db.users.update(localUser.id, { lastLoginAt: now, updatedAt: now });
        localUser = { ...localUser, lastLoginAt: now, updatedAt: now };
      }

      localStorage.setItem('smriti_session_token', data.sessionToken);
      localStorage.setItem('smriti_user_id', String(localUser.id || data.user.id));
      localStorage.setItem('smriti_user', JSON.stringify(localUser));
      setAppMode(localUser.isDemo ? 'demo' : 'production');

      setCurrentUser(localUser);
      console.log(`✅ Patient PIN authenticated via server: ${localUser.name}`);
      return { success: true, user: localUser };
    } catch (serverErr) {
      console.warn('Server PIN auth unavailable, falling back to local Dexie:', serverErr.message);

      // Offline Dexie Verification Fallback
      try {
        await initializeDatabase();
        const patients = await db.users.where('role').equals('patient').toArray();
        const user = patients.find((p) => p.pin === enteredPin);

        if (!user) {
          return { success: false, error: 'Incorrect PIN. Try 1234 or tap instant demo.' };
        }

        const now = new Date().toISOString();
        await db.users.update(user.id, { lastLoginAt: now, updatedAt: now });
        user.lastLoginAt = now;

        const sessionToken = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

        await db.sessions.add({
          userId: user.id,
          token: sessionToken,
          expiresAt,
          createdAt: now
        });

        localStorage.setItem('smriti_session_token', sessionToken);
        localStorage.setItem('smriti_user_id', String(user.id));
        localStorage.setItem('smriti_user', JSON.stringify(user));
        setAppMode(user.isDemo ? 'demo' : 'production');

        setCurrentUser(user);
        return { success: true, user };
      } catch (err) {
        console.error('❌ PIN login error:', err);
        return { success: false, error: 'PIN login failed. Please try again.' };
      }
    }
  };

  // Helper for Google Identity Services (GIS) Token Client
  const initGisTokenClient = (clientId, targetRole, resolve) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            resolve({ success: false, error: `Google OAuth was cancelled or failed: ${tokenResponse.error}` });
            return;
          }
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            if (!userInfoRes.ok) {
              throw new Error('Failed to fetch profile information from Google.');
            }
            const googleUser = await userInfoRes.json();
            const email = googleUser.email?.toLowerCase();
            const name = googleUser.name || email?.split('@')[0] || 'User';
            const avatar = googleUser.picture || null;
          const normalizedTarget = normalizeRole(targetRole);

            // Enforce role isolation via server
            const srvRes = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name, avatar, targetRole: normalizedTarget })
            });
            const srvData = await srvRes.json();
            if (!srvRes.ok || !srvData.success) {
              resolve({ success: false, error: srvData.error || 'Google authentication was rejected.' });
              return;
            }

            await initializeDatabase();
            let existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
            const now = new Date().toISOString();

            if (!existingUser) {
              const userRecord = {
                name,
                email,
                role: normalizedTarget,
                passwordHash: '',
                avatar,
                profileImage: avatar,
                location: 'Assam, India',
                relation: normalizedTarget === 'caregiver' ? 'Family Caregiver' : '',
                designation: normalizedTarget === 'healthcare' ? 'Healthcare Professional' : '',
                isDemo: false,
                isVerified: true,
                status: 'active',
                lastLoginAt: now,
                createdAt: now,
                updatedAt: now
              };
              const newId = await db.users.add(userRecord);
              existingUser = { id: newId, ...userRecord };
            } else {
              const updates = { lastLoginAt: now, updatedAt: now };
              if (!existingUser.profileImage && avatar) updates.profileImage = avatar;
              if (!existingUser.name && name) updates.name = name;
              await db.users.update(existingUser.id, updates);
              existingUser = { ...existingUser, ...updates };
            }

            localStorage.setItem('smriti_session_token', srvData.sessionToken);
            localStorage.setItem('smriti_user_id', String(existingUser.id));
            localStorage.setItem('smriti_user', JSON.stringify(existingUser));
            setAppMode('production');

            setCurrentUser(existingUser);
            resolve({ success: true, user: existingUser });
          } catch (fetchErr) {
            resolve({ success: false, error: fetchErr.message || 'Failed to authenticate Google user.' });
          }
        },
        error_callback: (nonOAuthError) => {
          resolve({ success: false, error: nonOAuthError.message || 'Google account prompt was closed.' });
        }
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (gisErr) {
      resolve({ success: false, error: gisErr.message || 'Failed to initialize Google login client.' });
    }
  };

  // REAL GOOGLE OAUTH FLOW
  const loginWithGoogle = async (targetRole = 'caregiver') => {
    try {
      localStorage.setItem('smriti_oauth_role', targetRole);

      // Provider 1: Supabase Cloud OAuth
      if (isSupabaseConfigured() && supabase) {
        const redirectUrl = `${window.location.origin}/login?role=${targetRole}`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.url && typeof window !== 'undefined') {
          window.location.href = data.url;
        }

        return { success: true, url: data?.url };
      }

      // Provider 2: Google Identity Services (GIS) Client ID
      const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};
      const googleClientId = env.VITE_GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        return {
          success: false,
          error: 'Google OAuth requires cloud configuration. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (with Google provider enabled in your Supabase Dashboard) or VITE_GOOGLE_CLIENT_ID in your .env file.'
        };
      }

      return new Promise((resolve) => {
        if (typeof window === 'undefined') {
          resolve({ success: false, error: 'Google OAuth is only available in browser.' });
          return;
        }

        if (!window.google?.accounts?.oauth2) {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.onload = () => {
            initGisTokenClient(googleClientId, targetRole, resolve);
          };
          script.onerror = () => {
            resolve({ success: false, error: 'Failed to load Google Identity Services client.' });
          };
          document.head.appendChild(script);
        } else {
          initGisTokenClient(googleClientId, targetRole, resolve);
        }
      });
    } catch (err) {
      console.error('❌ Google OAuth initialization error:', err);
      return { success: false, error: err.message || 'Google OAuth failed to start.' };
    }
  };

  // 1-TAP DEMO LOGIN FLOW (Instant Judge Demo)
  const loginDemo = async (role) => {
    try {
      await initializeDatabase();
      await ensureDemoUsers();
      await seedDatabaseIfEmpty();

      const normalizedRole = normalizeRole(role);
      let user = await db.users.where('role').equals(normalizedRole).first();

      // Fallback lookups by email or alias
      if (!user && normalizedRole === 'healthcare') {
        user = await db.users.where('email').equalsIgnoreCase('phukan@health.assam.gov.in').first();
      }
      if (!user && normalizedRole === 'patient') {
        user = await db.users.where('email').equalsIgnoreCase('amma@smriticare.org').first();
      }
      if (!user && normalizedRole === 'caregiver') {
        user = await db.users.where('email').equalsIgnoreCase('priya@smriticare.org').first();
      }
      if (!user) {
        const aliases = normalizedRole === 'healthcare'
          ? ['healthcare', 'clinician', 'healthcare_worker', 'healthcare-professional', 'doctor']
          : [normalizedRole];
        user = await db.users.where('role').anyOf(aliases).first();
      }

      if (!user) {
        throw new Error(`Demo user for role "${role}" not found in database.`);
      }

      // Session isolation: clean up previous session token
      const oldToken = localStorage.getItem('smriti_session_token');
      if (oldToken) {
        try {
          await db.sessions.where('token').equals(oldToken).delete();
        } catch {}
      }
      localStorage.removeItem('smriti_selected_patient_id');

      const now = new Date().toISOString();
      await db.users.update(user.id, { lastLoginAt: now, updatedAt: now });
      user.lastLoginAt = now;

      const sessionToken = `sess_demo_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

      await db.sessions.add({
        userId: user.id,
        token: sessionToken,
        expiresAt,
        createdAt: now
      });

      localStorage.setItem('smriti_session_token', sessionToken);
      localStorage.setItem('smriti_user_id', String(user.id));
      localStorage.setItem('smriti_user', JSON.stringify(user));
      setAppMode('demo');

      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('❌ Demo login error:', err);
      throw err;
    }
  };

  // CONTINUOUS ROLE SWITCH FLOW (Switches to the dedicated account for that role)
  const loginContinuous = async (targetRole) => {
    try {
      await initializeDatabase();
      await ensureDemoUsers();
      await seedDatabaseIfEmpty();

      const normalizedRole = normalizeRole(targetRole);
      let user = await db.users.where('role').equals(normalizedRole).first();

      // Fallback lookups
      if (!user && normalizedRole === 'healthcare') {
        user = await db.users.where('email').equalsIgnoreCase('phukan@health.assam.gov.in').first();
      }
      if (!user && normalizedRole === 'patient') {
        user = await db.users.where('email').equalsIgnoreCase('amma@smriticare.org').first();
      }
      if (!user && normalizedRole === 'caregiver') {
        user = await db.users.where('email').equalsIgnoreCase('priya@smriticare.org').first();
      }
      if (!user) {
        const aliases = normalizedRole === 'healthcare'
          ? ['healthcare', 'clinician', 'healthcare_worker', 'healthcare-professional', 'doctor']
          : [normalizedRole];
        user = await db.users.where('role').anyOf(aliases).first();
      }

      if (!user) {
        throw new Error(`Dedicated account for continuous role "${targetRole}" not found in database.`);
      }

      const oldToken = localStorage.getItem('smriti_session_token');
      if (oldToken) {
        try {
          await db.sessions.where('token').equals(oldToken).delete();
        } catch (delErr) {
          console.warn('Old session cleanup note:', delErr);
        }
      }

      localStorage.removeItem('smriti_selected_patient_id');

      const now = new Date().toISOString();
      await db.users.update(user.id, { lastLoginAt: now, updatedAt: now });
      user.lastLoginAt = now;

      const sessionToken = `sess_cont_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

      await db.sessions.add({
        userId: user.id,
        token: sessionToken,
        expiresAt,
        createdAt: now
      });

      localStorage.setItem('smriti_session_token', sessionToken);
      localStorage.setItem('smriti_user_id', String(user.id));
      localStorage.setItem('smriti_user', JSON.stringify(user));
      setAppMode(user.isDemo ? 'demo' : 'continuous');

      setCurrentUser(user);
      console.log(`✅ Switched to Continuous Account: ${user.name} (#${user.id}, role: ${user.role})`);
      return user;
    } catch (err) {
      console.error('❌ Continuous login error:', err);
      throw err;
    }
  };

  // LOGOUT FLOW
  const logout = async () => {
    const token = localStorage.getItem('smriti_session_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: token })
        });
      } catch {
        // Server logout best effort
      }
      try {
        await db.sessions.where('token').equals(token).delete();
      } catch (err) {
        console.warn('Session delete warning:', err);
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (supaSignOutErr) {
        console.warn('Supabase sign out notice:', supaSignOutErr);
      }
    }

    localStorage.removeItem('smriti_session_token');
    localStorage.removeItem('smriti_user_id');
    localStorage.removeItem('smriti_user');
    localStorage.removeItem('smriti_selected_patient_id');
    localStorage.removeItem('smriti_oauth_role');
    setCurrentUser(null);
  };

  // UPDATE USER PROFILE
  const updateUserProfile = async (updates) => {
    if (!currentUser?.id) {
      return { success: false, error: 'No user is currently authenticated.' };
    }

    try {
      await initializeDatabase();
      const now = new Date().toISOString();

      const allowedFields = ['name', 'phone', 'location', 'relation', 'designation', 'age', 'language', 'theme', 'profileImage', 'avatar'];
      const sanitizedUpdates = { updatedAt: now };

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      }

      await db.users.update(currentUser.id, sanitizedUpdates);

      if (currentUser.role === 'patient') {
        const patientProfile = await db.patientProfiles.where('userId').equals(currentUser.id).first();
        if (patientProfile) {
          const profileUpdates = { updatedAt: now };
          if (sanitizedUpdates.name) profileUpdates.name = sanitizedUpdates.name;
          if (sanitizedUpdates.location) profileUpdates.location = sanitizedUpdates.location;
          if (sanitizedUpdates.age) profileUpdates.age = Number(sanitizedUpdates.age);
          await db.patientProfiles.update(patientProfile.id, profileUpdates);
        }
      }

      const updatedUser = { ...currentUser, ...sanitizedUpdates };
      localStorage.setItem('smriti_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      return { success: false, error: err.message || 'Failed to update profile.' };
    }
  };

  // REMOVE PROFILE PHOTO
  const removeProfilePhoto = async () => {
    if (!currentUser?.id) {
      return { success: false, error: 'No user is currently authenticated.' };
    }
    try {
      await initializeDatabase();
      const now = new Date().toISOString();
      await db.users.update(currentUser.id, {
        profileImage: null,
        avatar: null,
        updatedAt: now
      });

      const updatedUser = { ...currentUser, profileImage: null, avatar: null, updatedAt: now };
      localStorage.setItem('smriti_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('❌ Failed to remove profile photo:', err);
      return { success: false, error: err.message || 'Failed to remove photo.' };
    }
  };

  // CHANGE PASSWORD FLOW
  const changePassword = async (oldPassword, newPassword) => {
    if (!currentUser?.id) {
      return { success: false, error: 'No authenticated user found.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      await initializeDatabase();
      const user = await db.users.get(currentUser.id);
      if (!user) {
        return { success: false, error: 'User account not found.' };
      }

      if (user.passwordHash) {
        const inputOldHash = await hashPassword(oldPassword);
        const isMatch = user.passwordHash === inputOldHash || user.passwordHash === oldPassword;
        if (!isMatch) {
          return { success: false, error: 'Current password is incorrect.' };
        }
      }

      const newHash = await hashPassword(newPassword);
      const now = new Date().toISOString();

      await db.users.update(currentUser.id, {
        passwordHash: newHash,
        updatedAt: now
      });

      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.auth.updateUser({ password: newPassword });
        } catch (supaErr) {
          console.warn('Supabase cloud password sync notice:', supaErr.message);
        }
      }

      const updatedUser = { ...currentUser, passwordHash: newHash, updatedAt: now };
      localStorage.setItem('smriti_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      return { success: true };
    } catch (err) {
      console.error('❌ Failed to change password:', err);
      return { success: false, error: err.message || 'Failed to change password.' };
    }
  };

  // SEND PASSWORD RESET EMAIL / TOKEN
  const sendPasswordResetEmail = async (email) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try server reset endpoint
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, resetToken: data.resetToken };
      }
    } catch {
      // Offline fallback
    }

    try {
      await initializeDatabase();
      const user = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();

      let supabaseDispatched = false;
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/reset-password`
          });
          if (!error) supabaseDispatched = true;
        } catch (supaErr) {
          console.warn('Supabase reset email notice:', supaErr.message);
        }
      }

      if (user) {
        const resetToken = `rst_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
        const resetExpiresAt = new Date(Date.now() + 3600000).toISOString();
        await db.users.update(user.id, {
          resetToken,
          resetExpiresAt,
          updatedAt: new Date().toISOString()
        });

        return {
          success: true,
          message: supabaseDispatched
            ? `Password reset link sent to ${normalizedEmail} via cloud auth.`
            : `Password reset verification ready for ${normalizedEmail}.`,
          userFound: true,
          email: normalizedEmail,
          resetToken
        };
      }

      if (supabaseDispatched) {
        return {
          success: true,
          message: `Password reset instructions sent to ${normalizedEmail}.`,
          userFound: true,
          email: normalizedEmail
        };
      }

      return {
        success: false,
        error: 'No account registered with this email address.'
      };
    } catch (err) {
      console.error('❌ Password reset request failed:', err);
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  };

  // RESET PASSWORD WITH TOKEN
  const resetPasswordWithToken = async ({ email, token, newPassword }) => {
    if (!email || !newPassword) {
      return { success: false, error: 'Email and new password are required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await initializeDatabase();
      const user = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();

      if (!user) {
        return { success: false, error: 'No account found with this email address.' };
      }

      if (user.resetToken && token && user.resetToken !== token) {
        return { success: false, error: 'Invalid or expired reset token.' };
      }

      const newHash = await hashPassword(newPassword);
      const now = new Date().toISOString();

      await db.users.update(user.id, {
        passwordHash: newHash,
        resetToken: null,
        resetExpiresAt: null,
        updatedAt: now
      });

      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.auth.updateUser({ password: newPassword });
        } catch (supaErr) {
          console.warn('Supabase password update notice:', supaErr.message);
        }
      }

      return { success: true, message: 'Password updated successfully! You can now sign in.' };
    } catch (err) {
      console.error('❌ Failed to reset password:', err);
      return { success: false, error: err.message || 'Password reset failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        register,
        loginWithEmail,
        loginWithPin,
        loginWithGoogle,
        loginDemo,
        loginContinuous,
        logout,
        updateUserProfile,
        removeProfilePhoto,
        changePassword,
        sendPasswordResetEmail,
        resetPasswordWithToken,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
