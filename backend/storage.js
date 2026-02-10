const db = {};

function saveProject(userId, project) {
  if (!userId) return;
  const record = {
    ...project,
    created_at: Date.now() / 1000,
  };
  if (!db[userId]) db[userId] = [];
  db[userId].push(record);
}

function getProjects(userId) {
  if (!userId) return [];
  const items = (db[userId] || []).map((item) => ({ ...item }));
  for (const item of items) {
    if (!item.images && item.image) item.images = [item.image];
  }
  return items.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

function clearProjects(userId) {
  if (!userId) return;
  db[userId] = [];
}

module.exports = { saveProject, getProjects, clearProjects };
