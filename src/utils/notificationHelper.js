/**
 * notificationHelper.js
 * Generates genuine application event notifications for PersonalOS from user data.
 */

import { getTodayDate, isOverdue, isRevisionDue } from './date.js';
import { isProjectOverdue } from './project.js';

export function generateNotifications({
  tasks = [],
  plannerTasks = [],
  projects = [],
  dsaProblems = [],
  readIds = []
} = {}) {
  const readSet = new Set(readIds || []);
  const today = getTodayDate();
  const notifications = [];

  // 1. Overdue Tasks (High Severity)
  for (const t of tasks) {
    if (!t || t.completed) continue;
    if (isOverdue(t)) {
      const id = `task-overdue-${t.id}`;
      notifications.push({
        id,
        category: 'task',
        title: 'Task Overdue',
        message: `"${t.text}" was due on ${t.dueDate}`,
        detail: `Priority: ${t.priority || 'Normal'} • Category: ${t.category || 'General'}`,
        severity: 'danger',
        date: t.dueDate,
        link: '/tasks',
        read: readSet.has(id),
        timestamp: t.dueDate || today,
        raw: t,
      });
    }
  }

  // 2. Tasks Due Today (Warning Severity)
  for (const t of tasks) {
    if (!t || t.completed) continue;
    if (t.dueDate === today) {
      const id = `task-today-${t.id}`;
      notifications.push({
        id,
        category: 'task',
        title: 'Task Due Today',
        message: `"${t.text}" is due today`,
        detail: `Priority: ${t.priority || 'Normal'} • Category: ${t.category || 'General'}`,
        severity: 'warning',
        date: today,
        link: '/tasks',
        read: readSet.has(id),
        timestamp: today,
        raw: t,
      });
    }
  }

  // 3. High-Priority Pending Tasks (Info Severity, if not overdue/today)
  for (const t of tasks) {
    if (!t || t.completed) continue;
    if (t.priority === 'High' && !isOverdue(t) && t.dueDate !== today) {
      const id = `task-high-${t.id}`;
      notifications.push({
        id,
        category: 'task',
        title: 'High Priority Task',
        message: `"${t.text}" needs attention`,
        detail: t.dueDate ? `Due date: ${t.dueDate}` : `Category: ${t.category || 'General'}`,
        severity: 'info',
        date: t.dueDate || today,
        link: '/tasks',
        read: readSet.has(id),
        timestamp: t.dueDate || today,
        raw: t,
      });
    }
  }

  // 4. Overdue Projects (Danger Severity)
  for (const p of projects) {
    if (!p) continue;
    if (isProjectOverdue(p)) {
      const id = `project-overdue-${p.id}`;
      notifications.push({
        id,
        category: 'project',
        title: 'Project Deadline Passed',
        message: `Project "${p.name}" deadline was ${p.deadline}`,
        detail: `Status: ${p.status || 'In Progress'} • Progress: ${p.progress || 0}%`,
        severity: 'danger',
        date: p.deadline,
        link: '/projects',
        read: readSet.has(id),
        timestamp: p.deadline || today,
        raw: p,
      });
    }
  }

  // 5. Daily Planner Agenda for Today (Info Severity)
  for (const pt of plannerTasks) {
    if (!pt || pt.completed) continue;
    if (pt.date === today) {
      const id = `planner-today-${pt.id}`;
      notifications.push({
        id,
        category: 'planner',
        title: 'Planner Agenda',
        message: `"${pt.title}" is on your agenda for today`,
        detail: `Priority: ${pt.priority || 'Medium'}`,
        severity: 'info',
        date: today,
        link: '/planner',
        read: readSet.has(id),
        timestamp: today,
        raw: pt,
      });
    }
  }

  // 6. DSA Problems Due for Spaced Revision (Warning Severity)
  for (const d of dsaProblems) {
    if (!d || !d.solved) continue;
    if (isRevisionDue(d)) {
      const id = `dsa-revision-${d.id}`;
      notifications.push({
        id,
        category: 'dsa',
        title: 'DSA Revision Due',
        message: `"${d.title}" (${d.topic || 'DSA'}) is ready for spaced repetition`,
        detail: `Platform: ${d.platform || 'DSA'} • Difficulty: ${d.difficulty || 'Medium'}`,
        severity: 'warning',
        date: d.nextRevisionDate || today,
        link: '/dsa',
        read: readSet.has(id),
        timestamp: d.nextRevisionDate || today,
        raw: d,
      });
    }
  }

  // Sort: unread first, then by severity (danger > warning > info)
  const severityRank = { danger: 3, warning: 2, info: 1 };
  notifications.sort((a, b) => {
    if (a.read !== b.read) {
      return a.read ? 1 : -1; // unread first
    }
    const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    if (diff !== 0) return diff;
    return (b.timestamp || '').localeCompare(a.timestamp || '');
  });

  return notifications;
}
