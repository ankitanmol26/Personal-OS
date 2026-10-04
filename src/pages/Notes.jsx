import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Trash2, Edit3, Tag, Clock } from "lucide-react";

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

function Notes() {
  const [notes, setNotes] = useState(() => getStorage("notes"));
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DSA");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setStorage("notes", notes);
  }, [notes]);

  function addNote(event) {
    event.preventDefault();
    if (title.trim() === "" || content.trim() === "") return;

    const newNote = {
      id: Date.now(),
      title, category, content, tags,
      createdAt: new Date().toLocaleDateString(),
    };

    setNotes([newNote, ...notes]);
    resetForm();
  }

  function deleteNote(id) {
    setNotes(notes.filter((note) => note.id !== id));
  }

  function startEditing(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setCategory(note.category);
    setContent(note.content);
    setTags(note.tags || "");
  }

  function updateNote(event) {
    event.preventDefault();
    if (title.trim() === "" || content.trim() === "") return;

    setNotes(
      notes.map((note) =>
        note.id === editingId
          ? { ...note, title, category, content, tags, updatedAt: new Date().toLocaleDateString() }
          : note
      )
    );
    resetForm();
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
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>Notes</h2>
        <p className="page-description">Store and search your learning and project notes.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-card-title">Total Notes</span>
          <strong className="stat-card-value">{totalNotes}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">DSA</span>
          <strong className="stat-card-value">{dsaNotes}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Java</span>
          <strong className="stat-card-value">{javaNotes}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Interview</span>
          <strong className="stat-card-value">{interviewNotes}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <form className="notes-form card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div className="form-group flex-1" style={{ minWidth: '240px' }}>
              <input type="text" className="input-field" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ minWidth: '150px' }}>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {["DSA", "Java", "Spring Boot", "React", "College", "Projects", "Interview", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group flex-1" style={{ minWidth: '240px' }}>
              <input type="text" className="input-field" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>
          
          <div className="form-group">
            <textarea className="input-field" placeholder="Write your note..." value={content} onChange={(e) => setContent(e.target.value)} style={{ minHeight: '120px', resize: 'vertical' }} />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: 'flex-end' }}>
            {editingId !== null && (
              <button type="button" className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary">
              {editingId !== null ? "Save Changes" : "Add Note"}
            </button>
          </div>
        </form>

        <div className="notes-section">
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group flex-1" style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" className="input-field" placeholder="Search notes, content, tags..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
            <div className="form-group" style={{ width: '200px' }}>
              <select className="input-field" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                {["DSA", "Java", "Spring Boot", "React", "College", "Projects", "Interview", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="notes-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredNotes.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <FileText size={48} className="text-muted" style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No notes found.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="note-card card" key={note.id} style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
                    <div className="note-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', lineHeight: 1.3 }}>{note.title}</h3>
                        <span className={getCategoryBadge(note.category)}>{note.category}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" className="icon-button edit-button" onClick={() => startEditing(note)}>
                          <Edit3 size={16} />
                        </button>
                        <button type="button" className="icon-button delete-button" onClick={() => deleteNote(note.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="note-content" style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </p>

                    <div className="note-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {note.tags && (
                        <div className="note-tags flex items-center flex-wrap" style={{ gap: '8px' }}>
                          <Tag size={14} className="text-muted" />
                          {note.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', padding: '2px 8px' }} key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      <div className="note-date flex items-center gap-xs muted-text" style={{ fontSize: '12px' }}>
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
      </div>
    </main>
  );
}

export default Notes;