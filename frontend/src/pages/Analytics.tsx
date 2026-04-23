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

const statColors = [
  { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
  { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
  { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
];

const StatCard = ({ title, value, icon: Icon, colorIndex = 0 }: any) => {
  const color = statColors[colorIndex % statColors.length];
  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border ${color.border} relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full ${color.bg} opacity-60`} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">
            {value ?? 0}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${color.bg}`}>
          <Icon className={`h-5 w-5 ${color.icon}`} />
        </div>
      </div>
    </div>
  );
};

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
    const interval = setInterval(load, 5001);
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

  const completionRate = data.completionRate || 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of projects, tasks, and team performance
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* PROJECT STATS */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Projects</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Projects" value={data.projects?.total_projects} icon={BarChart3} colorIndex={0} />
          <StatCard title="Active" value={data.projects?.active_projects} icon={TrendingUp} colorIndex={1} />
          <StatCard title="Completed" value={data.projects?.completed_projects} icon={CheckCircle} colorIndex={2} />
          <StatCard title="Not Started" value={data.projects?.not_started_projects} icon={Clock} colorIndex={3} />
        </div>
      </div>

      {/* TASK STATS */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tasks</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Tasks" value={data.tasks?.total_tasks} icon={BarChart3} colorIndex={0} />
          <StatCard title="Completed" value={data.tasks?.completed_tasks} icon={CheckCircle} colorIndex={1} />
          <StatCard title="Pending" value={data.tasks?.pending_tasks} icon={Clock} colorIndex={3} />
          <StatCard title="Overdue" value={data.tasks?.overdue_tasks} icon={Clock} colorIndex={2} />
        </div>
      </div>

      {/* COMPLETION RATE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Task Completion Rate</h3>
          <span className="text-lg font-bold text-blue-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${completionRate}%`,
              background: completionRate > 70
                ? "linear-gradient(to right, #10b981, #059669)"
                : completionRate > 40
                ? "linear-gradient(to right, #3b82f6, #6366f1)"
                : "linear-gradient(to right, #f59e0b, #ef4444)"
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* TEAM WORKLOAD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold flex items-center gap-2 text-gray-800">
            <Users className="h-4 w-4 text-blue-600" />
            Team Workload
          </h2>
        </div>

        <div className="divide-y divide-gray-50">
          {data.workload?.length ? (
            data.workload.map((u: any, i: number) => {
              const done = u.completed_tasks ?? 0;
              const total = u.task_count ?? 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={u.id} className="flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500"][i % 4]
                    }`}>
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-24">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 text-right">{pct}%</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-700 font-medium">{total} tasks</p>
                      <p className="text-green-600 text-xs">{done} done</p>
                    </div>
                  </div>
                </div>
              );
            })
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