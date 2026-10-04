import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import TodayFocus from "../components/TodayFocus";
import DSAProgress from "../components/DSAProgress";
import UpcomingTasks from "../components/UpcomingTasks";
import useDashboardData from "../hooks/useDashboardData";
import RecentActivity from "../components/RecentActivity";

function Dashboard() {
  const {
    tasks,
    dsaProblems,
    pendingTasks,
    pendingTaskCount,
    overdueTaskCount,
    dsaTotal,
    dsaSolved,
    unsolvedProblems,
    dsaProgress,
    dsaDueTodayCount,
    dsaMasteredCount,
    projectCount,
    noteCount,
    plannerTodayCount,
    plannerCompletedTodayCount,
    plannerRemainingTodayCount,
    plannerOverdueCount,
  } = useDashboardData();

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>Today's Overview</h2>
        <p className="page-description">Your PersonalOS activity at a glance.</p>
      </div>

      <div className="dashboard-grid">
        <StatCard title="Tasks" value={pendingTaskCount} description={`pending out of ${tasks.length}`} />
        <StatCard title="DSA" value={dsaSolved} description={`solved out of ${dsaTotal}`} />
        <StatCard title="DSA Progress" value={`${dsaProgress}%`} description="overall completion" />
        <StatCard title="Projects" value={projectCount} description="total projects" />
        <StatCard title="Notes" value={noteCount} description="total notes" />
        <StatCard title="Overdue" value={overdueTaskCount} description="tasks need attention" />
      </div>

      <div className="dashboard-quick-links">
        <Link to="/projects" className="dashboard-quick-link card">
          <strong>Projects</strong>
          <span>Manage your development projects →</span>
        </Link>

        <Link to="/notes" className="dashboard-quick-link card">
          <strong>Notes</strong>
          <span>Search your knowledge base →</span>
        </Link>
      </div>

      <section className="dashboard-planner card">
        <div className="section-heading">
          <h3>Today's Plan</h3>
          <p>Your current daily workload.</p>
        </div>

        <div className="dashboard-planner-stats">
          <div>
            <span>Today's Tasks</span>
            <strong>{plannerTodayCount}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{plannerCompletedTodayCount}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{plannerRemainingTodayCount}</strong>
          </div>
          <div>
            <span>Overdue</span>
            <strong>{plannerOverdueCount}</strong>
          </div>
        </div>

        <Link to="/planner" className="dashboard-action btn-primary">
          Open Planner →
        </Link>
      </section>

      <DSAProgress solved={dsaSolved} total={dsaTotal} />

      <section className="dashboard-revision card">
        <div className="section-heading">
          <h3>DSA Revision</h3>
          <p>Keep your solved problems fresh.</p>
        </div>

        <div className="dashboard-revision-stats">
          <div>
            <span>Due Today</span>
            <strong>{dsaDueTodayCount}</strong>
          </div>
          <div>
            <span>Mastered</span>
            <strong>{dsaMasteredCount}</strong>
          </div>
        </div>

        <Link to="/dsa" className="dashboard-action btn-primary">
          Open DSA Tracker →
        </Link>
      </section>
      
      <UpcomingTasks tasks={tasks} />
      <TodayFocus pendingTaskList={pendingTasks} unsolvedProblems={unsolvedProblems} />
      <RecentActivity tasks={tasks} dsaProblems={dsaProblems} />
    </main>
  );
}

export default Dashboard;