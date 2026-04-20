import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface CalendarEvent {
  id: string;
  title: string;
  type: "task";
  dueDate: string;
  completed?: boolean;
  assignedTo?: string;
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) fetchEvents();
    else setLoading(false);
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await api.get<any[]>("/tasks");

      const formatted: CalendarEvent[] = res.data
        .filter((t) => t.due_date)
        .map((task) => ({
          id: task.id,
          title: task.title,
          type: "task",
          dueDate: task.due_date,
          completed: task.completed,
          assignedTo: task.assigned_to,
        }));

      setEvents(formatted);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];

    return events.filter((event) => {
      const d = new Date(event.dueDate);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  };

  const getDayStatus = (date: Date | null) => {
    if (!date) return "none";

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    for (const event of events) {
      const due = new Date(event.dueDate);
      due.setHours(0, 0, 0, 0);

      const diff =
        (due.getTime() - checkDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff === 0) return "due";
    }

    return "none";
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    const start = firstDay.getDay();

    for (let i = 0; i < start; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++)
      days.push(new Date(year, month, d));

    return days;
  };

  const isToday = (date: Date | null): boolean =>
    !!date && date.toDateString() === new Date().toDateString();

  const isSelectedDate = (date: Date | null): boolean =>
    !!date && date.toDateString() === selectedDate.toDateString();

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="flex gap-6 text-gray-900">

      {/* LEFT CALENDAR */}
      <div className="w-1/2">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Calendar</h1>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date, i) => {
            const status = getDayStatus(date);

            let border = "border-transparent";

            if (status === "due") border = "border-red-500";
            if (isToday(date)) border = "border-gray-900";

            return (
              <button
                key={i}
                onClick={() => date && setSelectedDate(date)}
                className={`aspect-square rounded-lg border
                ${!date ? "invisible" : ""}
                ${border}
                ${
                  isSelectedDate(date)
                    ? "bg-purple-600 text-white"
                    : "text-gray-900 hover:bg-gray-200"
                }`}
              >
                {date?.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT EVENTS */}
      <div className="w-1/2 space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Events for {selectedDate.toDateString()}
        </h2>

        {selectedDateEvents.length === 0 ? (
          <p className="text-gray-500">No events</p>
        ) : (
          selectedDateEvents.map((event) => {
            const due = new Date(event.dueDate);
            const today = new Date();

            today.setHours(0, 0, 0, 0);
            due.setHours(0, 0, 0, 0);

            const diff =
              (due.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24);

            let border = "border-blue-500";

            if (event.completed) border = "border-green-500";
            else if (diff < 0 || diff === 0) border = "border-red-500";
            else if (diff === 1) border = "border-yellow-500";

            return (
              <div key={event.id} className={`border ${border} rounded-lg p-3`}>
                <div className="font-semibold text-gray-900">{event.title}</div>

                <div className="text-sm text-gray-600">
                  Due: {new Date(event.dueDate).toLocaleDateString()}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default CalendarPage;