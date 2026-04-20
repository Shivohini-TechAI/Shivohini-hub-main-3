import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { fetchAnalytics } from "../services/analyticsService";

const StatCard = ({ title, value, icon: Icon }: any) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
          {value ?? 0}
        </p>
      </div>
      <Icon className="text-blue-600" />
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        const res = await fetchAnalytics(user.id, user.role);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);

  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of projects, tasks, and team performance
          </p>
        </div>

        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          ● Live
        </span>
      </div>

      {/* PROJECT STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={data.projects?.total_projects} icon={BarChart3} />
        <StatCard title="Active" value={data.projects?.active_projects} icon={TrendingUp} />
        <StatCard title="Completed" value={data.projects?.completed_projects} icon={CheckCircle} />
        <StatCard title="Not Started" value={data.projects?.not_started_projects} icon={Clock} />
      </div>

      {/* TASK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={data.tasks?.total_tasks} icon={BarChart3} />
        <StatCard title="Completed" value={data.tasks?.completed_tasks} icon={CheckCircle} />
        <StatCard title="Pending" value={data.tasks?.pending_tasks} icon={Clock} />
        <StatCard title="Overdue" value={data.tasks?.overdue_tasks} icon={Clock} />
      </div>

      {/* COMPLETION RATE */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm text-gray-500 mb-2">Task Completion Rate</h3>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${data.completionRate || 0}%` }}
          />
        </div>

        <p className="text-right mt-2 font-semibold">
          {data.completionRate || 0}%
        </p>
      </div>

      {/* TEAM WORKLOAD (TABLE STYLE) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Workload
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.workload?.length ? (
            data.workload.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center px-5 py-3">

                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>

                <div className="text-right text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    {u.task_count ?? 0} tasks
                  </p>
                  <p className="text-green-600 font-medium">
                    {u.completed_tasks ?? 0} done
                  </p>
                </div>

              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center p-5">
              No workload data available
            </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Analytics;