/**
 * SmritiCare Server-Side Reminder Handler
 * Provides REST endpoints for managing patient care reminders & schedules.
 */

// In-memory server store for reminders (mirrored with database records)
const serverReminders = new Map();

// Seed initial default reminders
const defaultReminders = [
  {
    id: 1,
    targetUserId: 1,
    userId: 1,
    patientId: 1,
    title: 'Morning BP Tablet (Amlodipine 5mg)',
    label: 'Morning BP Tablet (Amlodipine 5mg)',
    time: '08:30 AM',
    scheduledAt: '08:30 AM',
    dueAt: '08:30 AM',
    type: 'medicine',
    category: 'medicine',
    recurring: 'daily',
    frequency: 'daily',
    priority: 'high',
    done: false,
    completed: false,
    status: 'pending',
    createdBy: 'Priya Borah',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    targetUserId: 1,
    userId: 1,
    patientId: 1,
    title: 'Warm Chamomile Hydration & Walk',
    label: 'Warm Chamomile Hydration & Walk',
    time: '11:00 AM',
    scheduledAt: '11:00 AM',
    dueAt: '11:00 AM',
    type: 'routine',
    category: 'routine',
    recurring: 'daily',
    frequency: 'daily',
    priority: 'normal',
    done: false,
    completed: false,
    status: 'pending',
    createdBy: 'Priya Borah',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    targetUserId: 1,
    userId: 1,
    patientId: 1,
    title: 'Evening Calcium & Memory Routine',
    label: 'Evening Calcium & Memory Routine',
    time: '06:30 PM',
    scheduledAt: '06:30 PM',
    dueAt: '06:30 PM',
    type: 'medicine',
    category: 'medicine',
    recurring: 'daily',
    frequency: 'daily',
    priority: 'normal',
    done: false,
    completed: false,
    status: 'pending',
    createdBy: 'Priya Borah',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

defaultReminders.forEach(r => serverReminders.set(r.id, r));

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
 * GET /api/reminders
 * Query: ?patientId=... or ?targetUserId=...
 */
export async function handleGetReminders(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const patientIdParam = url.searchParams.get('patientId') || url.searchParams.get('targetUserId') || url.searchParams.get('userId');
    
    let list = Array.from(serverReminders.values());
    if (patientIdParam) {
      const pid = Number(patientIdParam);
      list = list.filter(r => Number(r.targetUserId) === pid || Number(r.userId) === pid || Number(r.patientId) === pid);
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      reminders: list,
      count: list.length
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Failed to retrieve reminders.' }));
  }
}

/**
 * POST /api/reminders
 * Body: { patientId, targetUserId, title, label, time, category, type, frequency, recurring, priority, createdBy }
 */
export async function handleCreateReminder(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  }

  try {
    const data = await parseJsonBody(req);
    const {
      patientId,
      targetUserId,
      userId,
      title,
      label,
      time,
      scheduledAt,
      dueAt,
      category,
      type,
      frequency,
      recurring,
      priority,
      createdBy,
      isDemo
    } = data;

    const resolvedPatientId = Number(patientId || targetUserId || userId);
    if (!resolvedPatientId || isNaN(resolvedPatientId)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Target patient ID is required.' }));
    }

    const reminderTitle = (title || label || '').trim();
    if (!reminderTitle) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Please enter a reminder title.' }));
    }

    const reminderTime = (time || scheduledAt || dueAt || '09:00 AM').trim();
    if (!reminderTime) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Please select a time.' }));
    }

    const reminderCategory = (category || type || 'medicine').toLowerCase();
    const reminderFrequency = (frequency || recurring || 'daily').toLowerCase();
    const reminderPriority = (priority || 'normal').toLowerCase();

    const newId = serverReminders.size > 0 ? Math.max(...Array.from(serverReminders.keys())) + 1 : 1;
    const now = new Date().toISOString();

    const newReminder = {
      id: newId,
      targetUserId: resolvedPatientId,
      userId: resolvedPatientId,
      patientId: resolvedPatientId,
      title: reminderTitle,
      label: reminderTitle,
      time: reminderTime,
      scheduledAt: reminderTime,
      dueAt: reminderTime,
      type: reminderCategory,
      category: reminderCategory,
      recurring: reminderFrequency,
      frequency: reminderFrequency,
      priority: reminderPriority,
      done: false,
      completed: false,
      status: 'pending',
      createdBy: createdBy || 'Caregiver',
      isDemo: Boolean(isDemo),
      createdAt: now,
      updatedAt: now
    };

    serverReminders.set(newId, newReminder);

    console.log(`✅ [Reminder Server] Created Reminder #${newId} for Patient #${resolvedPatientId}: "${reminderTitle}" at ${reminderTime} (${reminderCategory})`);

    res.statusCode = 201;
    return res.end(JSON.stringify({
      success: true,
      reminder: newReminder,
      message: 'Reminder added successfully.'
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Server failed to create reminder.' }));
  }
}

/**
 * DELETE /api/reminders
 * Query: ?id=... or Body: { id }
 */
export async function handleDeleteReminder(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    let reminderId;
    if (req.method === 'DELETE' || req.method === 'POST') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      reminderId = url.searchParams.get('id');
      if (!reminderId) {
        const data = await parseJsonBody(req);
        reminderId = data.id;
      }
    }

    if (!reminderId) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Reminder ID is required.' }));
    }

    const idNum = Number(reminderId);
    if (serverReminders.has(idNum)) {
      serverReminders.delete(idNum);
    }

    console.log(`🗑️ [Reminder Server] Deleted Reminder #${idNum}`);

    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, message: 'Reminder deleted successfully.' }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Server failed to delete reminder.' }));
  }
}

/**
 * PATCH /api/reminders
 * Body: { id, done, completed, status }
 */
export async function handleToggleReminder(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const data = await parseJsonBody(req);
    const { id, done, completed, status } = data;

    if (!id) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Reminder ID is required.' }));
    }

    const idNum = Number(id);
    const existing = serverReminders.get(idNum);
    if (!existing) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ success: false, error: 'Reminder not found.' }));
    }

    const isDone = done !== undefined ? Boolean(done) : Boolean(completed);
    const updated = {
      ...existing,
      done: isDone,
      completed: isDone,
      status: status || (isDone ? 'completed' : 'pending'),
      updatedAt: new Date().toISOString()
    };

    serverReminders.set(idNum, updated);

    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, reminder: updated }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, error: 'Failed to update reminder status.' }));
  }
}
