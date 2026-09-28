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
    dsaTotal,
    dsaSolved,
    unsolvedProblems,
    dsaProgress,
    projectCount,
    noteCount,
  } = useDashboardData();

  return (
    <main className="dashboard">

      <h2>Today's Overview</h2>

      <p className="page-description">
        Your PersonalOS activity at a glance.
      </p>

      <div className="dashboard-grid">

        <StatCard
          title="Tasks"
          value={pendingTaskCount}
          description={`pending out of ${tasks.length}`}
        />

        <StatCard
          title="DSA"
          value={dsaSolved}
          description={`solved out of ${dsaTotal}`}
        />

        <StatCard
          title="DSA Progress"
          value={`${dsaProgress}%`}
          description="overall completion"
        />

        <StatCard
          title="Projects"
          value={projectCount}
          description="total projects"
        />

        <StatCard
          title="Notes"
          value={noteCount}
          description="total notes"
        />

      </div>
      <DSAProgress
  solved={dsaSolved}
  total={dsaTotal}
/>
      <UpcomingTasks
        tasks={tasks}
      />
      <TodayFocus
        pendingTaskList={pendingTasks}
        unsolvedProblems={unsolvedProblems}
      />
      <RecentActivity
        tasks={tasks}
        dsaProblems={dsaProblems}
      />

    </main>
  );
}

export default Dashboard;