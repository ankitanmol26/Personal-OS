import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, BookOpen, LayoutDashboard, Plus, 
  CheckCircle, Circle, AlertCircle, Calendar, 
  Code, Activity, Hash, Tag, Clock, FileText, CheckSquare, Target, Folder
} from "lucide-react";
import useDashboardData from "../hooks/useDashboardData";
import { ApiError, ApiLoading } from "../components/ApiFeedback";
import { isOverdue, getTodayDate } from "../utils/date";
import { isProjectOverdue } from "../utils/project";
import "./Dashboard.css";

function Dashboard() {
  const { tasks, projects, dsaProblems, notes, loading, error, loadData } = useDashboardData();
  const navigate = useNavigate();

  // Tasks Derived
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = pendingTasks.filter(t => isOverdue(t));
  const highPriorityTasks = pendingTasks.filter(t => t.priority === "High");
  const dueTodayTasks = pendingTasks.filter(t => t.dueDate === getTodayDate());
  
  // Projects Derived
  const activeProjects = projects.filter(p => p.status === "In Progress" || p.status === "Planning");
  const overdueProjects = activeProjects.filter(p => isProjectOverdue(p));
  const avgProgress = activeProjects.length === 0 ? 0 : Math.round(activeProjects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / activeProjects.length);

  // DSA Derived
  const dsaTotal = dsaProblems.length;
  const dsaSolved = dsaProblems.filter(p => p.solved).length;
  const dsaUnsolved = dsaTotal - dsaSolved;
  const dsaProgress = dsaTotal === 0 ? 0 : Math.round((dsaSolved / dsaTotal) * 100);

  // ----------------------------------------------------
  // SECTION: TODAY'S TASKS
  // Prioritize: Overdue -> Due today -> High priority -> Others
  const getTodayTasks = () => {
    const todayList = [];
    const addedIds = new Set();
    const addTasks = (taskList) => {
      taskList.forEach(t => {
        if (!addedIds.has(t.id)) {
          todayList.push(t);
          addedIds.add(t.id);
        }
      });
    };
    addTasks(overdueTasks);
    addTasks(dueTodayTasks);
    addTasks(highPriorityTasks);
    addTasks(pendingTasks);
    return todayList.slice(0, 5); // show limited number
  };
  const todayTasks = getTodayTasks();

  // ----------------------------------------------------
  // SECTION: UPCOMING DEADLINES
  // Task due dates + Project deadlines (chronological)
  const getUpcomingItems = () => {
    const items = [];
    const today = getTodayDate();
    
    tasks.forEach(t => {
      if (!t.completed && t.dueDate && t.dueDate >= today) {
        items.push({ id: `t-${t.id}`, name: t.text, type: 'Task', date: t.dueDate, priority: t.priority });
      }
    });

    projects.forEach(p => {
      if (p.status !== "Completed" && p.deadline && p.deadline >= today) {
        items.push({ id: `p-${p.id}`, name: p.name, type: 'Project', date: p.deadline, status: p.status });
      }
    });

    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  };
  const upcomingItems = getUpcomingItems();

  // ----------------------------------------------------
  // SECTION: PROJECT OVERVIEW
  // Active projects, prioritize in progress -> near deadline -> planning
  const getTopProjects = () => {
    return [...activeProjects].sort((a, b) => {
      if (a.status === "In Progress" && b.status !== "In Progress") return -1;
      if (a.status !== "In Progress" && b.status === "In Progress") return 1;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      return 0;
    }).slice(0, 3);
  };
  const topProjects = getTopProjects();

  // ----------------------------------------------------
  // SECTION: DSA TOPIC BREAKDOWN
  const getDsaTopics = () => {
    const topics = {};
    dsaProblems.forEach(p => {
      if (!topics[p.topic]) topics[p.topic] = { total: 0, solved: 0 };
      topics[p.topic].total += 1;
      if (p.solved) topics[p.topic].solved += 1;
    });
    return Object.entries(topics)
      .map(([name, data]) => ({ name, ...data, percentage: Math.round((data.solved / data.total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4); // show top 4 topics
  };
  const dsaTopics = getDsaTopics();

  // ----------------------------------------------------
  // SECTION: RECENT NOTES
  const recentNotes = [...notes]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  const StatCard = ({ title, value, description, type }) => {
    const typeClass = `stat-card type-${type}`;
    return (
      <div className={typeClass}>
        <div className="stat-card-title">{title}</div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-description">{description}</div>
      </div>
    );
  };

  return (
    <main className="dashboard-v2">
      <div className="dashboard-v2-header">
        <h2>Dashboard</h2>
        <p className="page-description">Command Center for PersonalOS</p>
      </div>

      <ApiError error={error} onRetry={loadData} />

      {loading && tasks.length === 0 && projects.length === 0 && dsaProblems.length === 0 && notes.length === 0 ? (
        <ApiLoading message="Loading dashboard metrics..." />
      ) : (
        <>
      {/* OVERVIEW STATS */}
      <div className="dashboard-v2-stats">
        <StatCard title="Tasks" value={pendingTasks.length} description={`${totalTasks} total tasks`} type="accent" />
        <StatCard title="DSA" value={`${dsaProgress}%`} description={`${dsaSolved} / ${dsaTotal} solved`} type="info" />
        <StatCard title="Projects" value={activeProjects.length} description={`${avgProgress}% avg progress`} type="success" />
        <StatCard title="Overdue" value={overdueTasks.length + overdueProjects.length} description="tasks & projects" type="danger" />
      </div>

      <div className="dashboard-v2-grid">
        
        {/* LEFT COLUMN */}
        <div className="dashboard-column">
          
          {/* TODAY */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>TODAY</h3>
              <Link to="/tasks" className="section-link">View All Tasks →</Link>
            </div>
            <div className="card-container">
              {todayTasks.length === 0 ? (
                <div className="empty-state">No pending tasks. You're clear.</div>
              ) : (
                <div className="list-group">
                  {todayTasks.map(task => {
                    const isTaskOverdue = isOverdue(task);
                    return (
                      <div className="list-item task-item" key={task.id}>
                        <Circle size={18} className="item-icon-muted" />
                        <div className="item-content">
                          <div className="item-title">{task.text}</div>
                          <div className="item-meta">
                            {task.category || "General"}
                            {task.dueDate && (
                              <span className={`meta-date ${isTaskOverdue ? "danger-text" : ""}`}>
                                 • {isTaskOverdue ? "Overdue" : "Due"} {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.priority === "High" && <span className="badge badge-danger">High</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* PROJECT OVERVIEW */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>PROJECTS</h3>
              <Link to="/projects" className="section-link">View Projects →</Link>
            </div>
            <div className="card-container">
              {topProjects.length === 0 ? (
                <div className="empty-state">No active projects yet.</div>
              ) : (
                <div className="project-grid">
                  {topProjects.map(proj => (
                    <div className="project-mini-card" key={proj.id}>
                      <div className="project-mini-header">
                        <span className="project-mini-title">{proj.name}</span>
                        <span className={`badge ${proj.status === "In Progress" ? "badge-warning" : "badge-info"}`}>{proj.status}</span>
                      </div>
                      {proj.deadline && <div className="project-mini-deadline"><Calendar size={12}/> {proj.deadline}</div>}
                      <div className="project-progress">
                        <div className="progress-bar">
                          <motion.div 
                            className="progress-fill" 
                            initial={{ width: 0 }} 
                            animate={{ width: `${proj.progress}%` }}
                            transition={{ duration: 0.8 }}
                          ></motion.div>
                        </div>
                        <span className="progress-text">{proj.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* DSA PROGRESS */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>DSA</h3>
              <Link to="/dsa" className="section-link">Open DSA Tracker →</Link>
            </div>
            <div className="card-container">
              {dsaTotal === 0 ? (
                <div className="empty-state">Start tracking your DSA progress.</div>
              ) : (
                <div className="dsa-overview">
                  <div className="dsa-main-stats">
                    <div className="dsa-stat">
                      <span className="dsa-stat-val">{dsaSolved}</span>
                      <span className="dsa-stat-label">Solved</span>
                    </div>
                    <div className="dsa-stat">
                      <span className="dsa-stat-val">{dsaUnsolved}</span>
                      <span className="dsa-stat-label">Pending</span>
                    </div>
                    <div className="dsa-stat">
                      <span className="dsa-stat-val">{dsaProgress}%</span>
                      <span className="dsa-stat-label">Completion</span>
                    </div>
                  </div>
                  {dsaTopics.length > 0 && (
                    <div className="dsa-topics">
                      {dsaTopics.map(topic => (
                        <div className="topic-row" key={topic.name}>
                          <div className="topic-name">{topic.name}</div>
                          <div className="progress-bar">
                            <motion.div 
                               className="progress-fill" 
                               initial={{ width: 0 }} 
                               animate={{ width: `${topic.percentage}%` }}
                               transition={{ duration: 0.8 }}
                            ></motion.div>
                          </div>
                          <div className="topic-pct">{topic.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-column">
          
          {/* QUICK ACTIONS */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>QUICK ACTIONS</h3>
            </div>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate("/tasks")}>
                <CheckSquare size={18} className="qa-icon" />
                <span>Add Task</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate("/dsa")}>
                <Code size={18} className="qa-icon" />
                <span>Add DSA</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate("/projects")}>
                <Folder size={18} className="qa-icon" />
                <span>Add Project</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate("/notes")}>
                <FileText size={18} className="qa-icon" />
                <span>Add Note</span>
              </button>
            </div>
          </section>

          {/* UPCOMING DEADLINES */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>UPCOMING</h3>
            </div>
            <div className="card-container">
              {upcomingItems.length === 0 ? (
                <div className="empty-state">No upcoming deadlines.</div>
              ) : (
                <div className="list-group">
                  {upcomingItems.map((item, idx) => (
                    <div className="list-item" key={idx}>
                      {item.type === 'Task' ? <CheckSquare size={16} className="item-icon-muted" /> : <Folder size={16} className="item-icon-muted" />}
                      <div className="item-content">
                        <div className="item-title">{item.name}</div>
                        <div className="item-meta">
                          {item.type} • {item.date}
                        </div>
                      </div>
                      <span className="badge">{item.priority || item.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RECENT NOTES */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>RECENT NOTES</h3>
              <Link to="/notes" className="section-link">View Notes →</Link>
            </div>
            <div className="card-container">
              {recentNotes.length === 0 ? (
                <div className="empty-state">Your knowledge base is empty.</div>
              ) : (
                <div className="list-group">
                  {recentNotes.map(note => (
                    <div className="list-item clickable" key={note.id} onClick={() => navigate("/notes")}>
                      <BookOpen size={16} className="item-icon-accent" />
                      <div className="item-content">
                        <div className="item-title">{note.title}</div>
                        <div className="item-meta">
                          {note.category} {note.createdAt && `• ${note.createdAt}`}
                        </div>
                      </div>
                      <ArrowRight size={14} className="item-icon-muted arrow-hover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
      </>
      )}
    </main>
  );
}

export default Dashboard;