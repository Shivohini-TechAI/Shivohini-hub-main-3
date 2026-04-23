import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { safeArray } from "../lib/api";
import api from "../lib/api";

const UserManagement: React.FC = () => {
  const { user } = useAuth();

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'project_manager' | 'team_leader' | 'team_member'>('all');

  // ================= FETCH USERS + TASKS =================
  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get<any[]>("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAllUsers(Array.isArray(res.data) ? res.data : []);

    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get<any[]>("/tasks", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTasks(safeArray(res.data));

    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  // ================= FILTER =================
  const filteredUsers = safeArray(allUsers).filter(u => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // ================= 🔥 FINAL FIX (MEMOIZED TASK MAP) =================
  const taskStatsMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};

    tasks.forEach((task: any) => {
      const userId = String(task.assigned_to || task.assignedTo || "");

      if (!map[userId]) {
        map[userId] = { total: 0, completed: 0 };
      }

      map[userId].total += 1;

      if (task.completed) {
        map[userId].completed += 1;
      }
    });

    return map;
  }, [tasks]);

  // ================= ROLE UPDATE =================
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("token");

      await api.put(`/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchUsers();

    } catch (err) {
      console.error("Role update error:", err);
    }
  };

  // ================= DELETE USER =================
  const handleDeleteUser = async (targetUser: any) => {
    if (user?.id === targetUser.id) {
      alert("You cannot delete yourself");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/users/${targetUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchUsers();

    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  // ================= UI =================
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">User Management</h1>

      <input
        placeholder="Search..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="border p-2 w-full"
      />

      <select
        value={roleFilter}
        onChange={e => setRoleFilter(e.target.value as any)}
        className="border p-2"
      >
        <option value="all">All</option>
        <option value="admin">Admin</option>
        <option value="project_manager">PM</option>
        <option value="team_leader">Team Leader</option>
        <option value="team_member">Team Member</option>
      </select>

      <div className="bg-white p-4 rounded shadow">
        {filteredUsers.map(u => {
          const stats = taskStatsMap[String(u.id)] || { total: 0, completed: 0 };

          return (
            <div key={u.id} className="border-b py-3 flex justify-between items-center">

              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-sm text-gray-500">{u.email}</div>
              </div>

              <div className="text-sm font-medium">
                Tasks: {stats.total} | Done: {stats.completed}
              </div>

              <div className="px-2 py-1 bg-gray-200 rounded text-sm">
                {u.role}
              </div>

              <div className="flex gap-2">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                  disabled={user?.role !== "admin"} // 🔐 only admin can change
                >
                  <option value="team_member">Team Member</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>

                <button onClick={() => handleDeleteUser(u)}>
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default UserManagement;