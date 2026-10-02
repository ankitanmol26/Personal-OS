import { useEffect, useState } from "react";
import {
  getStorage,
  setStorage,
} from "../utils/storage";

function Notes() {
 const [notes, setNotes] = useState(() => {
  return getStorage("notes");
});

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

    if (
      title.trim() === "" ||
      content.trim() === ""
    ) {
      return;
    }

    const newNote = {
      id: Date.now(),
      title: title,
      category: category,
      content: content,
      tags: tags,
      createdAt: new Date().toLocaleDateString(),
    };

    setNotes([...notes, newNote]);

    setTitle("");
    setCategory("DSA");
    setContent("");
    setTags("");
  }

  function deleteNote(id) {
    setNotes(
      notes.filter((note) => note.id !== id)
    );
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

    if (
      title.trim() === "" ||
      content.trim() === ""
    ) {
      return;
    }

    setNotes(
      notes.map((note) =>
        note.id === editingId
          ? {
              ...note,
              title: title,
              category: category,
              content: content,
              tags: tags,
              updatedAt:
                new Date().toLocaleDateString(),
            }
          : note
      )
    );

    setEditingId(null);
    setTitle("");
    setCategory("DSA");
    setContent("");
    setTags("");
  }

  function handleSubmit(event) {
    if (editingId !== null) {
      updateNote(event);
    } else {
      addNote(event);
    }
  }

  const filteredNotes = notes.filter((note) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      note.title.toLowerCase().includes(searchText) ||
      note.content.toLowerCase().includes(searchText) ||
      note.category.toLowerCase().includes(searchText) ||
      (note.tags || "")
        .toLowerCase()
        .includes(searchText);

    const matchesCategory =
      categoryFilter === "All" ||
      note.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalNotes = notes.length;

  const dsaNotes = notes.filter(
    (note) => note.category === "DSA"
  ).length;

  const javaNotes = notes.filter(
    (note) => note.category === "Java"
  ).length;

  const interviewNotes = notes.filter(
    (note) => note.category === "Interview"
  ).length;

  return (
    <main className="dashboard">

      <h2>Notes</h2>

      <p className="page-description">
        Store and search your learning and project notes.
      </p>

      <div className="notes-summary">

        <div className="notes-summary-card">
          <span>Total Notes</span>
          <strong>{totalNotes}</strong>
        </div>

        <div className="notes-summary-card">
          <span>DSA</span>
          <strong>{dsaNotes}</strong>
        </div>

        <div className="notes-summary-card">
          <span>Java</span>
          <strong>{javaNotes}</strong>
        </div>

        <div className="notes-summary-card">
          <span>Interview</span>
          <strong>{interviewNotes}</strong>
        </div>

      </div>

      {/* Search */}

      <input
        className="notes-search"
        type="text"
        placeholder="Search notes..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
      />

      <select
        className="notes-category-filter"
        value={categoryFilter}
        onChange={(event) =>
          setCategoryFilter(event.target.value)
        }
      >
        <option value="All">All Categories</option>
        <option value="DSA">DSA</option>
        <option value="Java">Java</option>
        <option value="Spring Boot">Spring Boot</option>
        <option value="React">React</option>
        <option value="College">College</option>
        <option value="Projects">Projects</option>
        <option value="Interview">Interview</option>
        <option value="Other">Other</option>
      </select>

      {/* Add Note */}

      <form
        className="notes-form"
        onSubmit={handleSubmit}
      >

        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
        />

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          <option>DSA</option>
          <option>Java</option>
          <option>Spring Boot</option>
          <option>React</option>
          <option>College</option>
          <option>Projects</option>
          <option>Interview</option>
          <option>Other</option>
        </select>

        <input
          type="text"
          placeholder="Tags e.g. arrays, interview, important"
          value={tags}
          onChange={(event) =>
            setTags(event.target.value)
          }
        />

        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit">
            {editingId !== null
              ? "Save Changes"
              : "Add Note"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setCategory("DSA");
                setContent("");
                setTags("");
              }}
            >
              Cancel
            </button>
          )}
        </div>

      </form>

      {/* Notes */}

      <div className="notes-list">

        {filteredNotes.length === 0 ? (
          <p className="empty-message">
            No notes found.
          </p>
        ) : (
          filteredNotes.map((note) => (
            <div
              className="note-card"
              key={note.id}
            >

              <div className="note-header">

                <div>
                  <h3>{note.title}</h3>

                  <span className="note-category">
                    {note.category}
                  </span>

                  {note.tags && (
                    <div className="note-tags">
                      {note.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            className="note-tag"
                            key={tag}
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => startEditing(note)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() =>
                      deleteNote(note.id)
                    }
                  >
                    Delete
                  </button>
                </div>

              </div>

              <p className="note-content">
                {note.content}
              </p>

              <small className="note-date">
                Created: {note.createdAt}

                {note.updatedAt && (
                  <> • Updated: {note.updatedAt}</>
                )}
              </small>

            </div>
          ))
        )}

      </div>

    </main>
  );
}

export default Notes;