import { db } from '../db/dexie.js';
import { queueSyncItem } from '../db/syncService.js';

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
  const targetId = Number(targetUserId);
  if (!targetId || isNaN(targetId)) {
    return { success: false, error: 'Invalid target user ID provided.' };
  }

  if (!requestingUser || !requestingUser.id) {
    return { success: false, error: 'Authentication required to delete a user.' };
  }

  const reqId = Number(requestingUser.id);
  const isSelf = reqId === targetId;

  try {
    const targetUser = await db.users.get(targetId);
    if (!targetUser) {
      return { success: false, error: 'User account not found in database.' };
    }

    // 1. Authorization checks
    const reqRole = requestingUser.role;
    const targetRole = targetUser.role;

    if (!isSelf) {
      if (reqRole === 'healthcare') {
        // Clinicians can archive/delete patients and caregivers in their jurisdiction
        // Prevent deleting another healthcare worker unless explicit admin
        if (targetRole === 'healthcare' && !requestingUser.isAdmin) {
          return { success: false, error: 'Cannot delete another Healthcare Professional account.' };
        }
      } else if (reqRole === 'caregiver') {
        // Caregivers can only delete/archive patients they personally created or are linked to
        const isAssigned = requestingUser.linkedPatientId === targetId ||
                           targetUser.createdByCaregiverId === reqId;
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
