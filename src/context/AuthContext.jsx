import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, seedDatabaseIfEmpty, initializeDatabase } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { setAppMode } from '../config/appMode';

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

  // Helper to synchronize a Supabase OAuth session user with Dexie DB and create local session
  const syncSupabaseSessionToDexie = async (supaUser) => {
    if (!supaUser) return null;
    const email = supaUser.email?.toLowerCase();
    const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email?.split('@')[0] || 'User';
    const avatar = supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture || null;
    const targetRole = localStorage.getItem('smriti_oauth_role') || 'caregiver';
    localStorage.removeItem('smriti_oauth_role');

    await initializeDatabase();
    let existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
    const now = new Date().toISOString();

    if (!existingUser) {
      const userRecord = {
        name,
        email,
        role: targetRole,
        passwordHash: '',
        avatar,
        profileImage: avatar,
        location: 'Assam, India',
        relation: targetRole === 'caregiver' ? 'Family Caregiver' : '',
        designation: targetRole === 'healthcare' ? 'Healthcare Professional' : '',
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
  };

  // App startup: Initialize Dexie, seed if completely empty, and restore active session
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
              console.warn('Failed to sync auth state change to Dexie:', authSyncErr);
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
        // NOTE: seedDatabaseIfEmpty() is explicitly decoupled from startup.
        // It runs ONLY when the user clicks 'Try Demo' to preserve honest 0-state.

        // 0. Attempt Supabase OAuth session restoration if redirected back from Google OAuth
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

        // 1. Attempt session restoration using session token from IndexedDB
        const savedToken = localStorage.getItem('smriti_session_token');
        if (savedToken) {
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

        // 2. Fallback restoration using persisted user ID
        const savedUserId = localStorage.getItem('smriti_user_id');
        if (savedUserId) {
          const user = await db.users.get(Number(savedUserId));
          if (user && isMounted) {
            setCurrentUser(user);
            setIsLoading(false);
            return;
          }
        }

        // 3. Fallback from cached user JSON if verified against IndexedDB
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

  // REGISTER NEW USER FLOW
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

    try {
      await initializeDatabase();

      // 2. Check for duplicate email in Dexie
      const existing = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();
      if (existing) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      // 3. Hash password
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      // 4. Dexie transaction: write user, profile, session, syncQueue
      const result = await db.transaction('rw', [db.users, db.patientProfiles, db.sessions, db.syncQueue], async () => {
        // Create user
        const userRecord = {
          name: name.trim(),
          email: normalizedEmail,
          role,
          passwordHash,
          pin: pin || (role === 'patient' ? '1234' : undefined),
          avatar: null,
          profileImage: null,
          age: age ? Number(age) : (role === 'patient' ? 74 : undefined),
          location,
          phone,
          relation: relation || (role === 'caregiver' ? 'Family Caregiver' : ''),
          designation: designation || (role === 'healthcare' ? 'PHC Medical Officer' : ''),
          isDemo: false,
          isVerified: true,
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now
        };

        const userId = await db.users.add(userRecord);
        const newUser = { id: userId, ...userRecord };

        // If registering patient, create patientProfile
        if (role === 'patient') {
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

        // Create active session in db.sessions
        const sessionToken = `sess_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

        await db.sessions.add({
          userId,
          token: sessionToken,
          expiresAt,
          createdAt: now
        });

        // Add user creation to syncQueue
        await db.syncQueue.add({
          userId,
          patientId: role === 'patient' ? userId : null,
          isDemo: false,
          entityType: 'users',
          entityId: userId,
          operation: 'INSERT',
          status: 'pending',
          createdAt: now,
          retryCount: 0,
          // backward compatibility
          tableName: 'users',
          recordId: userId,
          action: 'INSERT'
        });

        return { newUser, sessionToken };
      });

      // 5. Persist session
      localStorage.setItem('smriti_session_token', result.sessionToken);
      localStorage.setItem('smriti_user_id', String(result.newUser.id));
      localStorage.setItem('smriti_user', JSON.stringify(result.newUser));
      setAppMode('production');

      // 6. Set React state
      setCurrentUser(result.newUser);

      console.log(`✅ Real User registered and saved to IndexedDB: ${result.newUser.name} (#${result.newUser.id}) [isVerified=true]`);
      return { success: true, user: result.newUser };
    } catch (err) {
      console.error('❌ Registration failed:', err);
      return { success: false, error: err.message || 'Registration failed. Please try again.' };
    }
  };

  // LOGIN WITH EMAIL FLOW
  const loginWithEmail = async (email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await initializeDatabase();
      const user = await db.users.where('email').equalsIgnoreCase(normalizedEmail).first();

      if (!user) {
        return { success: false, error: 'No account found with this email. Please sign up.' };
      }

      // Verify password
      const inputHash = await hashPassword(password);
      const isPasswordValid =
        user.passwordHash === inputHash ||
        user.passwordHash === password ||
        (user.passwordHash === 'demo123' && password === 'demo123');

      if (!isPasswordValid) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      // Update lastLoginAt
      const now = new Date().toISOString();
      await db.users.update(user.id, { lastLoginAt: now, updatedAt: now });
      user.lastLoginAt = now;

      // Create session
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
      console.log(`✅ Logged in as: ${user.name} (#${user.id})`);
      return { success: true, user };
    } catch (err) {
      console.error('❌ Login error:', err);
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    }
  };

  // LOGIN WITH PIN FLOW (Patient)
  const loginWithPin = async (enteredPin) => {
    if (!enteredPin || enteredPin.length !== 4) {
      return { success: false, error: 'Please enter a 4-digit PIN.' };
    }

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

            await initializeDatabase();
            let existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
            const now = new Date().toISOString();

            if (!existingUser) {
              const userRecord = {
                name,
                email,
                role: targetRole,
                passwordHash: '',
                avatar,
                profileImage: avatar,
                location: 'Assam, India',
                relation: targetRole === 'caregiver' ? 'Family Caregiver' : '',
                designation: targetRole === 'healthcare' ? 'Healthcare Professional' : '',
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

            const sessionToken = `sess_gis_${existingUser.id}_${Date.now()}`;
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
      await seedDatabaseIfEmpty();

      const user = await db.users.where('role').equals(role).first();
      if (!user) {
        throw new Error(`Demo user for role "${role}" not found in database.`);
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
      setAppMode('demo');

      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('❌ Demo login error:', err);
      throw err;
    }
  };

  // LOGOUT FLOW
  const logout = async () => {
    const token = localStorage.getItem('smriti_session_token');
    if (token) {
      try {
        await db.sessions.where('token').equals(token).delete();
      } catch (err) {
        console.warn('Session delete warning:', err);
      }
    }

    localStorage.removeItem('smriti_session_token');
    localStorage.removeItem('smriti_user_id');
    localStorage.removeItem('smriti_user');
    localStorage.removeItem('smriti_selected_patient_id');
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

      // If patient, also update patientProfiles table
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

      // Add to syncQueue for cloud replication
      await db.syncQueue.add({
        userId: currentUser.id,
        patientId: currentUser.role === 'patient' ? currentUser.id : null,
        isDemo: !!currentUser.isDemo,
        entityType: 'users',
        entityId: currentUser.id,
        operation: 'UPDATE',
        status: 'pending',
        createdAt: now,
        retryCount: 0
      });

      const updatedUser = { ...currentUser, ...sanitizedUpdates };
      localStorage.setItem('smriti_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      return { success: false, error: err.message || 'Failed to update profile.' };
    }
  };

  // REMOVE PROFILE PHOTO (Reverts back to clean initials fallback)
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

      // Verify current password if user has one set
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

      // Update Supabase Auth if online/configured
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

      // Local IndexedDB password reset token generation
      if (user) {
        const resetToken = `rst_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
        const resetExpiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
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

      // If user not in local Dexie but Supabase succeeded
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

  // RESET PASSWORD WITH TOKEN / DIRECT RESET
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

      // Check token if present on record
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

      // Update Supabase Auth if session active or client configured
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
