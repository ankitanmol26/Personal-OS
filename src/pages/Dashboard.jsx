import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";
import StatCard from "../components/StatCard";
import TodayFocus from "../components/TodayFocus";
import DSAProgress from "../components/DSAProgress";
import UpcomingTasks from "../components/UpcomingTasks";
import useDashboardData from "../hooks/useDashboardData";
import RecentActivity from "../components/RecentActivity";
import "./Dashboard.css";

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

  const planProgress = plannerTodayCount === 0 ? 0 : Math.round((plannerCompletedTodayCount / plannerTodayCount) * 100);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>TODAY'S OVERVIEW</h2>
        <p className="page-description">Your PersonalOS activity at a glance.</p>
      </div>

      <div className="dashboard-main-grid">
        {/* Stats Row */}
        <div className="dashboard-stats">
          <StatCard title="Tasks" value={pendingTaskCount} description={`pending out of ${tasks.length}`} type="accent" delay={0} />
          <StatCard title="DSA" value={dsaSolved} description={`solved out of ${dsaTotal}`} type="info" delay={1} />
          <StatCard title="DSA Progress" value={`${dsaProgress}%`} description="overall completion" type="accent" delay={2} />
          <StatCard title="Projects" value={projectCount} description="total projects" type="success" delay={3} />
          <StatCard title="Notes" value={noteCount} description="total notes" type="info" delay={4} />
          <StatCard title="Overdue" value={overdueTaskCount} description="tasks need attention" type="danger" delay={5} />
        </div>

        {/* Quick Links Row */}
        <div className="dashboard-quick-actions">
          <Link to="/projects" className="quick-action-card">
            <div className="quick-action-icon"><LayoutDashboard size={20} /></div>
            <div className="quick-action-content">
              <span className="quick-action-title">Projects</span>
              <span className="quick-action-desc">Manage your development projects</span>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </Link>
          <Link to="/notes" className="quick-action-card">
            <div className="quick-action-icon"><BookOpen size={20} /></div>
            <div className="quick-action-content">
              <span className="quick-action-title">Notes</span>
              <span className="quick-action-desc">Search your knowledge base</span>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </Link>
        </div>

        {/* Today's Plan + DSA Progress */}
        <div className="dashboard-hero-section">
          <div className="hero-card">
            <div className="hero-header">
              <h3>Today's Plan</h3>
              <p>Your current daily workload.</p>
            </div>
            <div className="plan-stats-grid">
              <div className="plan-stat">
                <span className="plan-stat-value">{plannerTodayCount}</span>
                <span className="plan-stat-label">Tasks</span>
              </div>
              <div className="plan-stat">
                <span className="plan-stat-value">{plannerCompletedTodayCount}</span>
                <span className="plan-stat-label">Done</span>
              </div>
              <div className="plan-stat">
                <span className="plan-stat-value">{plannerRemainingTodayCount}</span>
                <span className="plan-stat-label">Remaining</span>
              </div>
              <div className="plan-stat">
                <span className="plan-stat-value">{plannerOverdueCount}</span>
                <span className="plan-stat-label">Overdue</span>
              </div>
            </div>
            <div className="plan-progress-container">
              <div className="plan-progress-bar">
                <motion.div 
                  className="plan-progress-fill"
                  initial={{ width: "0%" }}
                  animate={{ width: `${planProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <Link to="/planner" className="plan-action">
              Open Planner <ArrowRight size={14} />
            </Link>
          </div>
          <DSAProgress solved={dsaSolved} total={dsaTotal} />
        </div>

        {/* DSA Revision & Upcoming Tasks */}
        <div className="dashboard-middle-section">
          <div className="hero-card">
            <div className="hero-header">
              <h3>DSA Revision</h3>
              <p>Keep your solved problems fresh.</p>
            </div>
            <div className="dsa-revision-grid">
              <div className={`dsa-revision-stat ${dsaDueTodayCount > 0 ? 'warning' : 'success'}`}>
                <span className="revision-value">{dsaDueTodayCount > 0 ? dsaDueTodayCount : '✓'}</span>
                <span className="revision-label">{dsaDueTodayCount > 0 ? 'Due Today' : 'Nothing due today'}</span>
              </div>
              <div className="dsa-revision-stat">
                <span className="revision-value">{dsaMasteredCount}</span>
                <span className="revision-label">Mastered</span>
              </div>
            </div>
            <Link to="/dsa" className="plan-action" style={{ marginTop: 'auto' }}>
              Open DSA Tracker <ArrowRight size={14} />
            </Link>
          </div>
          <UpcomingTasks tasks={tasks} />
        </div>

        {/* Today's Focus & Recent Activity */}
        <div className="dashboard-bottom-section">
          <TodayFocus pendingTaskList={pendingTasks} unsolvedProblems={unsolvedProblems} />
          <RecentActivity tasks={tasks} dsaProblems={dsaProblems} />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;