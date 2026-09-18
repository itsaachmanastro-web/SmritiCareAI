import { db } from '../db/dexie.js';
import { queueSyncItem } from '../db/syncService.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';

/**
 * Service to manage User Lifecycle, Scoped Queries, and Safe Cascade Deletions.
 */

/**
 * Safely delete or archive a user with referential integrity checks and session revocation.
 * 
 * @param {number|string} targetUserId - ID of the user to delete/archive
 * @param {object} requestingUser - Authenticated user requesting the deletion
 * @param {object} options - Configuration options { softDelete: boolean, hardDelete: boolean, reason: string }
 * @returns {Promise<{ success: boolean, message?: string, error?: string, selfDeleted?: boolean }>}
 */
export async function deleteUser(targetUserId, requestingUser, options = {}) {
  if (!targetUserId) {
    return { success: false, error: 'Invalid target user ID provided.' };
  }

  if (!requestingUser || !requestingUser.id) {
    return { success: false, error: 'Authentication required to delete a user.' };
  }

  const numericTargetId = Number(targetUserId);
  const isNumeric = !isNaN(numericTargetId) && numericTargetId > 0;

  try {
    let targetUser = null;
    if (isNumeric) {
      targetUser = await db.users.get(numericTargetId);
    }
    if (!targetUser) {
      targetUser = await db.users.get(targetUserId);
    }
    if (!targetUser && isNumeric) {
      targetUser = await db.users.where('id').equals(numericTargetId).first();
    }
    if (!targetUser) {
      targetUser = await db.users.where('id').equals(String(targetUserId)).first();
    }

    if (!targetUser) {
      return { success: false, error: 'User account not found in database.' };
    }

    const targetId = targetUser.id;
    const reqId = requestingUser.id;
    const isSelf = String(reqId) === String(targetId);

    // 1. Authorization checks
    const reqRole = requestingUser.role;
    const targetRole = targetUser.role;

    if (!isSelf) {
      if (reqRole === 'healthcare' || reqRole === 'clinician') {
        // Clinicians can archive/delete patients and caregivers in their jurisdiction
        // Prevent deleting another healthcare worker unless explicit admin
        if ((targetRole === 'healthcare' || targetRole === 'clinician') && !requestingUser.isAdmin) {
          return { success: false, error: 'Cannot delete another Healthcare Professional account.' };
        }
      } else if (reqRole === 'caregiver') {
        // Caregivers can only delete/archive patients they personally created or are linked to
        const isAssigned = String(requestingUser.linkedPatientId) === String(targetId) ||
                           String(targetUser.createdByCaregiverId) === String(reqId);
        if (!isAssigned || targetRole !== 'patient') {
          return { success: false, error: 'Caregivers may only remove patients assigned to them.' };
        }
      } else {
        // Patients cannot delete other users
        return { success: false, error: 'Unauthorized to delete this user profile.' };
      }
    }

    const now = new Date().toISOString();
    const useSoftDelete = options.hardDelete !== true;

    // 2. Perform safe cascade operations in a Dexie transaction
    await db.transaction('rw', [
      db.users,
      db.patientProfiles,
      db.sessions,
      db.reminders,
      db.syncQueue
    ], async () => {
      // Step A: Invalidate all active sessions for the target user
      await db.sessions.where('userId').equals(targetId).delete();

      // Step B: Unlink foreign relationships
      if (targetRole === 'patient') {
        // Unlink any caregiver pointing to this patient
        const caregiversLinked = await db.users.where('linkedPatientId').equals(targetId).toArray();
        for (const cg of caregiversLinked) {
          await db.users.update(cg.id, {
            linkedPatientId: null,
            updatedAt: now
          });
        }

        // Soft-delete or remove patient profile
        const profiles = await db.patientProfiles.where('userId').equals(targetId).toArray();
        for (const p of profiles) {
          if (useSoftDelete) {
            await db.patientProfiles.update(p.id, {
              status: 'archived',
              archivedAt: now,
              updatedAt: now
            });
          } else {
            await db.patientProfiles.delete(p.id);
          }
        }
      } else if (targetRole === 'caregiver') {
        // Unlink caregiver from assigned patients
        const assignedPatients = await db.patientProfiles.where('primaryCaregiver').equals(targetUser.name).toArray();
        for (const ap of assignedPatients) {
          await db.patientProfiles.update(ap.id, {
            primaryCaregiver: 'Unassigned',
            updatedAt: now
          });
        }
      }

      // Step C: Delete or Archive User Record
      if (useSoftDelete) {
        await db.users.update(targetId, {
          status: 'archived',
          isDeleted: true,
          deletedAt: now,
          updatedAt: now,
          archiveReason: options.reason || 'Requested by authorized user'
        });
      } else {
        await db.users.delete(targetId);
      }

      // Step D: Queue sync item for cloud replication
      await queueSyncItem('users', targetId, 'DELETE', {
        id: targetId,
        status: 'archived',
        deletedAt: now
      }, {
        userId: reqId,
        patientId: targetRole === 'patient' ? targetId : null
      });
    });

    // Cloud update to Supabase if live
    if (isSupabaseConfigured() && supabase) {
      try {
        if (useSoftDelete) {
          await supabase.from('users').update({
            status: 'archived',
            is_deleted: true,
            deleted_at: now
          }).eq('id', targetId);

          await supabase.from('patient_profiles').update({
            status: 'archived',
            updated_at: now
          }).eq('user_id', targetId);
        } else {
          await supabase.from('patient_profiles').delete().eq('user_id', targetId);
          await supabase.from('users').delete().eq('id', targetId);
        }
      } catch (cloudErr) {
        console.warn('Supabase cloud delete notice:', cloudErr);
      }
    }

    // 3. Handle self-deletion session cleanup
    if (isSelf) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('smriti_session_token');
          localStorage.removeItem('smriti_user_id');
          localStorage.removeItem('smriti_user');
          localStorage.removeItem('smriti_selected_patient_id');
        }
      } catch (storageErr) {
        console.warn('Storage cleanup warning:', storageErr);
      }
    }

    console.log(`✅ Safely ${useSoftDelete ? 'archived' : 'deleted'} user: ${targetUser.name} (#${targetId})`);

    return {
      success: true,
      selfDeleted: isSelf,
      message: `User account "${targetUser.name}" was successfully ${useSoftDelete ? 'archived' : 'deleted'}.`
    };
  } catch (err) {
    console.error('❌ Failed to safely delete user:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while deleting the user.'
    };
  }
}

/**
 * Retrieves only the patient(s) assigned to a given caregiver.
 * Strict isolation: never leaks unrelated patients.
 * 
 * @param {object} caregiverUser - The authenticated caregiver user
 * @returns {Promise<Array>} List of authorized patient profiles
 */
export async function getPatientsForCaregiver(caregiverUser) {
  if (!caregiverUser || caregiverUser.role !== 'caregiver') {
    return [];
  }

  const caregiverId = Number(caregiverUser.id);
  const linkedId = caregiverUser.linkedPatientId ? Number(caregiverUser.linkedPatientId) : null;

  try {
    const allPatients = await db.users
      .where('role')
      .equals('patient')
      .toArray();

    // Active patients only (exclude archived records)
    const activePatients = allPatients.filter(p => p.status !== 'archived');

    // Caregiver is authorized to see:
    // 1. Explicitly linked patient (linkedPatientId)
    // 2. Any patient created by this caregiver (createdByCaregiverId)
    const authorized = activePatients.filter(p => {
      if (linkedId && p.id === linkedId) return true;
      if (p.createdByCaregiverId && Number(p.createdByCaregiverId) === caregiverId) return true;
      return false;
    });

    return authorized;
  } catch (err) {
    console.error('Error fetching caregiver patients:', err);
    return [];
  }
}

/**
 * Retrieves the patient cohort for a healthcare clinician with optional search & status filter.
 * 
 * @param {object} options - { search: string, filterStatus: string }
 * @returns {Promise<Array>} List of patient records with enriched profile data
 */
export async function getCohortForClinician({ search = '', filterStatus = 'all' } = {}) {
  try {
    const patients = await db.users.where('role').equals('patient').toArray();
    const profiles = await db.patientProfiles.toArray();

    const profileMap = new Map();
    profiles.forEach(p => profileMap.set(p.userId, p));

    // Enrich patient records
    let cohort = patients.map(p => {
      const prof = profileMap.get(p.id) || {};
      return {
        ...p,
        profileId: prof.id,
        age: p.age || prof.age || 72,
        location: p.location || prof.location || 'Assam, India',
        phcCenter: prof.phcCenter || 'Titabar PHC, Jorhat',
        primaryCaregiver: prof.primaryCaregiver || 'Family Caregiver'
      };
    });

    // Apply status filter
    if (filterStatus === 'active') {
      cohort = cohort.filter(p => p.status === 'active' || p.status === 'demo');
    } else if (filterStatus === 'archived') {
      cohort = cohort.filter(p => p.status === 'archived');
    } else if (filterStatus === 'non-archived') {
      cohort = cohort.filter(p => p.status !== 'archived');
    }

    // Apply search filter (name, id, location, caregiver)
    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      cohort = cohort.filter(p => {
        const matchName = p.name && p.name.toLowerCase().includes(query);
        const matchId = String(p.id).includes(query) || (`ner-${p.id}`).includes(query);
        const matchLoc = p.location && p.location.toLowerCase().includes(query);
        const matchCg = p.primaryCaregiver && p.primaryCaregiver.toLowerCase().includes(query);
        return matchName || matchId || matchLoc || matchCg;
      });
    }

    return cohort;
  } catch (err) {
    console.error('Error fetching clinician cohort:', err);
    return [];
  }
}

/**
 * Lightweight SHA-256 password hasher using standard Web Crypto API.
 */
export async function hashPassword(plainText) {
  if (!plainText) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return plainText;
  }
}

/**
 * Creates a real, authenticated user account on behalf of staff (clinician, healthcare, caregiver, or admin)
 * WITHOUT hijacking or invalidating the requesting user's active session.
 * 
 * @param {object} params - { requestingUser, userData }
 * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
 */
export async function createUserByStaff({ requestingUser, userData = {} }) {
  if (!requestingUser || !requestingUser.id) {
    return { success: false, error: 'Authentication required to create a user account.' };
  }

  const reqRole = requestingUser.role;
  const targetRole = userData.role || 'patient';

  // Authorization checks
  if (reqRole !== 'healthcare' && reqRole !== 'clinician' && reqRole !== 'caregiver' && !requestingUser.isAdmin) {
    return { success: false, error: 'Unauthorized: Only clinical staff and caregivers can provision new accounts.' };
  }

  if (targetRole === 'healthcare' || targetRole === 'clinician') {
    if (reqRole !== 'healthcare' && reqRole !== 'clinician' && !requestingUser.isAdmin) {
      return { success: false, error: 'Only healthcare administrators and clinicians can create clinical accounts.' };
    }
  }

  // Input validation
  const name = userData.name?.trim();
  if (!name || name.length < 2) {
    return { success: false, error: 'Full name is required (minimum 2 characters).' };
  }

  const email = userData.email?.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'A valid email address is required.' };
  }

  const password = userData.password || '';
  const confirmPassword = userData.confirmPassword || '';

  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  if (confirmPassword && password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please verify and retype.' };
  }

  if (targetRole === 'patient') {
    if (userData.pin && !/^\d{4}$/.test(String(userData.pin).trim())) {
      return { success: false, error: 'Patient PIN must be exactly 4 numeric digits.' };
    }
  }

  try {
    // Check for duplicate email in Dexie
    const existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
    if (existingUser && existingUser.status !== 'archived') {
      return {
        success: false,
        error: 'This email is already registered. Please use another email or open the existing account.'
      };
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const pin = userData.pin ? String(userData.pin).trim() : (targetRole === 'patient' ? '1234' : undefined);
    const age = userData.age ? Number(userData.age) : (targetRole === 'patient' ? 72 : undefined);
    const phone = userData.phone?.trim() || '';
    const location = userData.location?.trim() || 'Assam, India';
    const gender = userData.gender || 'female';
    const language = userData.language || (targetRole === 'patient' ? 'as' : 'en');
    const relation = userData.relation || (reqRole === 'caregiver' ? 'Family Member' : 'Patient');
    const designation = userData.designation?.trim() || (targetRole === 'healthcare' ? 'PHC Medical Officer' : '');
    const phcCenter = userData.phcCenter?.trim() || 'Titabar PHC, Jorhat';

    let newUserId;
    let newProfileId;

    await db.transaction('rw', [db.users, db.patientProfiles, db.syncQueue], async () => {
      // 1. Insert User Record
      const userRecord = {
        name,
        email,
        passwordHash,
        role: targetRole,
        pin,
        phone,
        age,
        gender,
        language,
        location,
        relation: targetRole === 'caregiver' ? relation : '',
        designation,
        isDemo: false,
        isVerified: true,
        status: 'active',
        createdByUserId: requestingUser.id,
        createdByRole: reqRole,
        createdByCaregiverId: reqRole === 'caregiver' ? requestingUser.id : null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now
      };

      newUserId = await db.users.add(userRecord);

      // 2. If Patient, Create Patient Profile Record
      if (targetRole === 'patient') {
        newProfileId = await db.patientProfiles.add({
          userId: newUserId,
          isDemo: false,
          name,
          age: age || 72,
          gender,
          location,
          phcCenter,
          primaryCaregiver: reqRole === 'caregiver' ? requestingUser.name : 'Unassigned',
          relation,
          createdAt: now,
          updatedAt: now
        });
      }

      // 3. Queue Sync Items for Cloud Sync
      await queueSyncItem('users', newUserId, 'INSERT', {
        id: newUserId,
        name,
        email,
        role: targetRole,
        age,
        location,
        designation,
        isDemo: false
      }, {
        userId: requestingUser.id,
        patientId: targetRole === 'patient' ? newUserId : null
      });

      if (targetRole === 'patient' && newProfileId) {
        await queueSyncItem('patientProfiles', newProfileId, 'INSERT', {
          id: newProfileId,
          userId: newUserId,
          name,
          age,
          location,
          phcCenter
        }, {
          userId: requestingUser.id,
          patientId: newUserId
        });
      }

      // 4. If Caregiver created patient, auto-link to caregiver
      if (reqRole === 'caregiver' && requestingUser.id) {
        await db.users.update(requestingUser.id, {
          linkedPatientId: newUserId,
          updatedAt: now
        });
      }
    });

    // Cloud synchronization to Supabase if connected
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('users').upsert({
          id: String(newUserId),
          name,
          email,
          role: targetRole,
          is_demo: false,
          created_at: now,
          updated_at: now
        });

        if (targetRole === 'patient' && newProfileId) {
          await supabase.from('patient_profiles').upsert({
            id: String(newProfileId),
            user_id: String(newUserId),
            name,
            age,
            location,
            phc_center: phcCenter,
            created_at: now,
            updated_at: now
          });
        }
      } catch (cloudErr) {
        console.warn('Supabase cloud user creation notice (offline-queued):', cloudErr);
      }
    }

    const createdUser = await db.users.get(newUserId);
    console.log(`✅ User created by staff (${reqRole} #${requestingUser.id}): ${name} (#${newUserId}) [role=${targetRole}]`);

    return {
      success: true,
      user: createdUser,
      message: `Account for "${name}" created successfully.`
    };
  } catch (err) {
    console.error('❌ Failed to create user by staff:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while creating the account.'
    };
  }
}

/**
 * Retrieves the Clinical & Healthcare Team directory.
 * 
 * @param {object} options - { search: string }
 * @returns {Promise<Array>} List of active healthcare professionals
 */
export async function getClinicalTeam({ search = '' } = {}) {
  try {
    const clinicians = await db.users
      .where('role')
      .anyOf(['healthcare', 'clinician'])
      .toArray();

    let activeTeam = clinicians.filter(c => c.status !== 'archived' && !c.isDeleted);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      activeTeam = activeTeam.filter(c => {
        const matchName = c.name && c.name.toLowerCase().includes(q);
        const matchEmail = c.email && c.email.toLowerCase().includes(q);
        const matchDesig = c.designation && c.designation.toLowerCase().includes(q);
        const matchLoc = c.location && c.location.toLowerCase().includes(q);
        return matchName || matchEmail || matchDesig || matchLoc;
      });
    }

    return activeTeam;
  } catch (err) {
    console.error('Error fetching clinical team:', err);
    return [];
  }
}
