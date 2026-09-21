import { useEffect, useState } from "react";

function Notes() {
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem("notes");

    return savedNotes
      ? JSON.parse(savedNotes)
      : [];
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DSA");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "notes",
      JSON.stringify(notes)
    );
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
      createdAt: new Date().toLocaleDateString(),
    };

    setNotes([...notes, newNote]);

    setTitle("");
    setCategory("DSA");
    setContent("");
  }

  function deleteNote(id) {
    setNotes(
      notes.filter((note) => note.id !== id)
    );
  }

  const filteredNotes = notes.filter((note) => {
    const searchText = search.toLowerCase();

    return (
      note.title.toLowerCase().includes(searchText) ||
      note.content.toLowerCase().includes(searchText) ||
      note.category.toLowerCase().includes(searchText)
    );
  });

  return (
    <main className="dashboard">

      <h2>Notes</h2>

      <p className="page-description">
        Store and search your learning and project notes.
      </p>

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

      {/* Add Note */}

      <form
        className="notes-form"
        onSubmit={addNote}
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

        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
        />

        <button type="submit">
          Add Note
        </button>

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
                </div>

                <button
                  className="delete-button"
                  onClick={() =>
                    deleteNote(note.id)
                  }
                >
                  Delete
                </button>

              </div>

              <p className="note-content">
                {note.content}
              </p>

              <small className="note-date">
                Created: {note.createdAt}
              </small>

            </div>
          ))
        )}

      </div>

    </main>
  );
}

export default Notes;