/**
 * searchHelper.js
 * Centralized search utility for PersonalOS application data.
 */

export function normalizeSearchData({
  tasks = [],
  projects = [],
  notes = [],
  dsaProblems = [],
  plannerTasks = [],
  trips = []
} = {}) {
  const normalized = [];

  // Normalize Tasks
  for (const t of tasks) {
    if (!t) continue;
    normalized.push({
      id: `task-${t.id}`,
      originalId: t.id,
      category: 'tasks',
      categoryLabel: 'Task',
      title: t.text || 'Untitled Task',
      subtitle: `${t.category || 'General'} • Priority: ${t.priority || 'Normal'}${t.dueDate ? ` • Due: ${t.dueDate}` : ''}`,
      status: t.completed ? 'Completed' : 'Pending',
      meta: t.dueDate || '',
      link: '/tasks',
      raw: t,
      searchableText: `${t.text || ''} ${t.category || ''} ${t.priority || ''} ${t.dueDate || ''}`.toLowerCase(),
    });
  }

  // Normalize Projects
  for (const p of projects) {
    if (!p) continue;
    const taskCount = p.tasks?.length ? `${p.tasks.length} tasks` : '';
    normalized.push({
      id: `project-${p.id}`,
      originalId: p.id,
      category: 'projects',
      categoryLabel: 'Project',
      title: p.name || 'Untitled Project',
      subtitle: `${p.status || 'Active'} • ${p.progress || 0}% progress${p.techStack ? ` • ${p.techStack}` : ''}`,
      status: p.status || 'In Progress',
      meta: p.deadline ? `Deadline: ${p.deadline}` : taskCount,
      link: '/projects',
      raw: p,
      searchableText: `${p.name || ''} ${p.description || ''} ${p.techStack || ''} ${p.status || ''}`.toLowerCase(),
    });
  }

  // Normalize Notes
  for (const n of notes) {
    if (!n) continue;
    const cleanContent = (n.content || '').replace(/<[^>]*>?/gm, ''); // strip HTML if any
    const excerpt = cleanContent.length > 80 ? `${cleanContent.substring(0, 80)}...` : cleanContent;
    normalized.push({
      id: `note-${n.id}`,
      originalId: n.id,
      category: 'notes',
      categoryLabel: 'Note',
      title: n.title || 'Untitled Note',
      subtitle: excerpt || n.category || 'Note',
      status: n.category || 'Note',
      meta: n.tags ? `Tags: ${n.tags}` : '',
      link: '/notes',
      raw: n,
      searchableText: `${n.title || ''} ${cleanContent} ${n.category || ''} ${n.tags || ''}`.toLowerCase(),
    });
  }

  // Normalize DSA Problems
  for (const d of dsaProblems) {
    if (!d) continue;
    normalized.push({
      id: `dsa-${d.id}`,
      originalId: d.id,
      category: 'dsa',
      categoryLabel: 'DSA',
      title: d.title || 'Untitled Problem',
      subtitle: `${d.platform || 'DSA'} • ${d.topic || 'General'} • ${d.difficulty || 'Medium'}`,
      status: d.solved ? 'Solved' : 'Unsolved',
      meta: d.nextRevisionDate ? `Next revision: ${d.nextRevisionDate}` : '',
      link: '/dsa',
      raw: d,
      searchableText: `${d.title || ''} ${d.topic || ''} ${d.difficulty || ''} ${d.platform || ''} ${d.notes || ''}`.toLowerCase(),
    });
  }

  // Normalize Planner Tasks
  for (const pt of plannerTasks) {
    if (!pt) continue;
    normalized.push({
      id: `planner-${pt.id}`,
      originalId: pt.id,
      category: 'planner',
      categoryLabel: 'Planner',
      title: pt.title || 'Untitled Schedule',
      subtitle: `Scheduled for ${pt.date || 'today'} • Priority: ${pt.priority || 'Medium'}`,
      status: pt.completed ? 'Completed' : 'Scheduled',
      meta: pt.date || '',
      link: '/planner',
      raw: pt,
      searchableText: `${pt.title || ''} ${pt.date || ''} ${pt.priority || ''}`.toLowerCase(),
    });
  }

  // Normalize Trips
  for (const tr of trips) {
    if (!tr) continue;
    normalized.push({
      id: `trip-${tr.id}`,
      originalId: tr.id,
      category: 'trips',
      categoryLabel: 'Trip',
      title: tr.name || 'Untitled Trip',
      subtitle: `Destination: ${tr.destination || 'Unspecified'}${tr.startDate ? ` (${tr.startDate})` : ''}`,
      status: 'Trip',
      meta: tr.currency ? `Currency: ${tr.currency}` : '',
      link: '/finance',
      raw: tr,
      searchableText: `${tr.name || ''} ${tr.destination || ''} ${tr.startDate || ''}`.toLowerCase(),
    });
  }

  return normalized;
}

/**
 * Filter items by query and active category tab
 */
export function filterSearchResults(items, query = '', categoryFilter = 'all') {
  const trimmed = query.trim().toLowerCase();

  let filtered = items;

  // Filter by category tab if not 'all'
  if (categoryFilter && categoryFilter !== 'all') {
    filtered = filtered.filter(item => item.category === categoryFilter);
  }

  // If no query, return the filtered list (or limited sample)
  if (!trimmed) {
    return filtered.slice(0, 20);
  }

  // Filter by matching query terms
  const terms = trimmed.split(/\s+/).filter(Boolean);

  return filtered.filter(item => {
    return terms.every(term => item.searchableText.includes(term));
  });
}
