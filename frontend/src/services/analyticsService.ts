const API = "http://localhost:5000";

export async function fetchAnalytics(userId: string, role: string) {
  const res = await fetch(`${API}/analytics?userId=${userId}&role=${role}`);

  if (!res.ok) throw new Error("Failed to fetch analytics");

  return res.json();
}