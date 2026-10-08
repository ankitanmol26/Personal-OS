import { useEffect, useState } from "react";
import { getNotes, createNote, updateNote as updateNoteApi, deleteNote as deleteNoteApi } from "../services/noteService";
import { useApi } from "../hooks/useApi";
import { ApiError, ApiLoading } from "../components/ApiFeedback";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Trash2, Edit3, Tag, Clock } from "lucide-react";
import "./Notes.css";

function getCategoryBadge(category) {
  switch (category) {
    case "DSA": return "badge badge-success";
    case "Java": return "badge badge-warning";
    case "React": return "badge badge-info";
    case "Projects": return "badge badge-danger";
    case "Interview": return "badge badge-success";
    default: return "badge";
  }
}

function StatCard({ label, value, type, delay = 0 }) {
  const indicatorColor = {
    accent: "var(--accent-primary)",
    info: "var(--status-info)",
    success: "var(--status-success)",
    warning: "var(--status-warning)",
    danger: "var(--status-danger)",
    neutral: "var(--text-muted)",
  }[type] || "var(--text-muted)";

  return (
    <motion.div 
      className="notes-stat-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: "easeOut" }}
    >
      <div className="notes-stat-title">
        {label}
        <span className="notes-stat-indicator" style={{ backgroundColor: indicatorColor }} />
      </div>
      <div className="notes-stat-value">{value}</div>
    </motion.div>
  );
}

function Notes() {
  const [notes, setNotes] = useState([]);
  const { loading, error, setError, withApi, withApiLoading } = useApi(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DSA");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const data = await withApiLoading(() => getNotes(), "Failed to load notes.");
      setNotes(data);
    } catch (err) {}
  }

  async function addNote(event) {
    event.preventDefault();
    if (title.trim() === "" || content.trim() === "") return;

    const newNote = { title, category, content, tags };

    try {
      const created = await withApi(() => createNote(newNote), "Failed to add note.");
      setNotes([created, ...notes]);
      resetForm();
    } catch (err) {}
  }

  async function deleteNote(id) {
    try {
      await withApi(() => deleteNoteApi(id), "Failed to delete note.");
      setNotes(notes.filter((note) => note.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {}
  }

  function startEditing(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setCategory(note.category);
    setContent(note.content);
    setTags(note.tags || "");
  }

  async function updateNote(event) {
    event.preventDefault();
    if (title.trim() === "" || content.trim() === "") return;

    try {
      const updated = await withApi(() => updateNoteApi(editingId, { title, category, content, tags }), "Failed to update note.");
      setNotes(notes.map((note) => (note.id === editingId ? updated : note)));
      resetForm();
    } catch (err) {}
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("DSA");
    setContent("");
    setTags("");
  }

  function handleSubmit(event) {
    if (editingId !== null) updateNote(event);
    else addNote(event);
  }

  const filteredNotes = notes.filter((note) => {
    const searchText = search.toLowerCase();
    const matchesSearch =
      note.title.toLowerCase().includes(searchText) ||
      note.content.toLowerCase().includes(searchText) ||
      note.category.toLowerCase().includes(searchText) ||
      (note.tags || "").toLowerCase().includes(searchText);

    const matchesCategory = categoryFilter === "All" || note.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalNotes = notes.length;
  const dsaNotes = notes.filter((note) => note.category === "DSA").length;
  const javaNotes = notes.filter((note) => note.category === "Java").length;
  const interviewNotes = notes.filter((note) => note.category === "Interview").length;

  return (
    <main className="dashboard notes-page">
      <div className="dashboard-header notes-header">
        <h2>Notes</h2>
        <p>Store and search your learning and project notes.</p>
      </div>

      <div className="notes-stats">
        <StatCard label="Total Notes" value={totalNotes} type="neutral" delay={0} />
        <StatCard label="DSA" value={dsaNotes} type="success" delay={1} />
        <StatCard label="Java" value={javaNotes} type="warning" delay={2} />
        <StatCard label="Interview" value={interviewNotes} type="success" delay={3} />
      </div>

      <ApiError error={error} onRetry={fetchNotes} />

      {loading && notes.length === 0 ? (
        <ApiLoading message="Loading notes..." />
      ) : (
        <>
      <AnimatePresence mode="wait">
        <motion.form 
          key={editingId !== null ? "edit" : "add"}
          className="notes-form" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="notes-form-header">
            {editingId !== null ? "Editing Note" : "Create New Note"}
          </h3>
          <div className="notes-form-row">
            <div className="notes-input-group">
              <label className="notes-input-label">Note Title</label>
              <input 
                type="text" 
                className="notes-input" 
                placeholder="What is this note about?" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>
            <div className="notes-input-group category">
              <label className="notes-input-label">Category</label>
              <select className="notes-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {["DSA", "Java", "Spring Boot", "React", "College", "Projects", "Interview", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="notes-input-group">
              <label className="notes-input-label">Tags</label>
              <input 
                type="text" 
                className="notes-input" 
                placeholder="e.g. arrays, sorting (comma separated)" 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="notes-input-group" style={{ minWidth: '100%' }}>
            <label className="notes-input-label">Content</label>
            <textarea 
              className="notes-textarea" 
              placeholder="Write your detailed note here..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              required
            />
          </div>

          <div className="notes-form-actions">
            {editingId !== null && (
              <button type="button" className="notes-btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="notes-btn-primary">
              {editingId !== null ? "Save Changes" : "Add Note"}
            </button>
          </div>
        </motion.form>
      </AnimatePresence>

      <div className="notes-section">
        <div className="notes-search-section">
          <div className="notes-search-bar">
            <Search size={18} className="notes-search-icon" />
            <input 
              type="text" 
              className="notes-search-input" 
              placeholder="Search notes by title, content, or tags..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <select 
            className="notes-filter-select" 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {["DSA", "Java", "Spring Boot", "React", "College", "Projects", "Interview", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="notes-empty">
              <FileText size={48} className="notes-empty-icon" />
              <p className="notes-empty-title">
                {search || categoryFilter !== "All" ? "No notes found" : "No notes yet"}
              </p>
              <p className="notes-empty-desc">
                {search || categoryFilter !== "All" ? "Try adjusting your search or filters." : "Create your first knowledge item above."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, index) => (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }} 
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="note-card" 
                  key={note.id} 
                >
                  <div className="note-header">
                    <div className="note-title-group">
                      <h3 className="note-title">{note.title}</h3>
                      <div>
                        <span className={getCategoryBadge(note.category)}>{note.category}</span>
                      </div>
                    </div>
                    <div className="note-actions">
                      <button type="button" className="note-btn-icon edit" onClick={() => startEditing(note)} aria-label="Edit note">
                        <Edit3 size={16} />
                      </button>
                      <button type="button" className="note-btn-icon delete" onClick={() => deleteNote(note.id)} aria-label="Delete note">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="note-content">
                    {note.content}
                  </p>

                  <div className="note-footer">
                    {note.tags && (
                      <div className="note-tags">
                        <Tag size={14} className="note-tag-icon" />
                        {note.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                          <span className="note-tag-pill" key={tag}>#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="note-date">
                      <Clock size={12} />
                      <span>Created: {note.createdAt} {note.updatedAt && `• Updated: ${note.updatedAt}`}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
      </>
      )}
    </main>
  );
}

export default Notes;