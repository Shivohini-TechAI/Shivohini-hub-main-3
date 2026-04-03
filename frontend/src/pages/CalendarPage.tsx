import React, { useState, useEffect } from "react";
import { User, AlertCircle } from "lucide-react";
import {} from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface CalendarEvent {
  id: string;
  title: string;
  type: "task" | "todo" | "client_note";
  dueDate: string;
  completed?: boolean;
  assignedTo?: string;
  clientName?: string;
  stage?: string;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  assigned_to: string;
}

interface TodoRow {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  user_id: string;
}

interface ClientNoteRow {
  id: string;
  note: string;
  deadline_date: string | null;
  stage: string;
  client_id: string;
  clients: { name: string } | null;
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

  const fetchEvents = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      const allEvents: CalendarEvent[] = [];

      const [tasksResult, todosResult, clientNotesResult] = await Promise.all([
        api.from("tasks").select("*").not("due_date", "is", null),
        api.from("personal_todos").select("*").not("due_date", "is", null),
        supabase
          .from("client_stage_notes")
          .select("*, clients(name)")
          .not("deadline_date", "is", null),
      ]);

      (tasksResult.data as TaskRow[] | null)?.forEach((task) => {
        if (task.due_date) {
          allEvents.push({
            id: task.id,
            title: task.title,
            type: "task",
            dueDate: task.due_date,
            completed: task.completed,
            assignedTo: task.assigned_to,
          });
        }
      });

      (todosResult.data as TodoRow[] | null)?.forEach((todo) => {
        if (todo.due_date) {
          allEvents.push({
            id: todo.id,
            title: todo.title,
            type: "todo",
            dueDate: todo.due_date,
            completed: todo.completed,
          });
        }
      });

      (clientNotesResult.data as ClientNoteRow[] | null)?.forEach((note) => {
        if (note.deadline_date) {
          allEvents.push({
            id: note.id,
            title:
              note.note.substring(0, 50) +
              (note.note.length > 50 ? "..." : ""),
            type: "client_note",
            dueDate: note.deadline_date,
            clientName: note.clients?.name || "Unknown Client",
            stage: note.stage,
          });
        }
      });

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
  if (!date) return [];

  return events.filter((event) => {
    const eventDate = new Date(event.dueDate);

    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  });
};

  const getEventStatus = (dueDate: string) => {
    const today = new Date();
    const eventDate = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) return "overdue";
    if (eventDate.getTime() === today.getTime()) return "today";
    return "upcoming";
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

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isSelectedDate = (date: Date | null): boolean => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="flex gap-6 text-white">

      {/* LEFT: CALENDAR */}
      <div className="w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Calendar</h1>
          {loading && <span className="text-gray-400 text-sm">Loading...</span>}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => (
            <button
              key={index}
              onClick={() => date && setSelectedDate(date)}
              className={`aspect-square rounded-lg
              ${!date ? "invisible" : ""}
              ${isToday(date) ? "ring-2 ring-orange-500" : ""}
              ${
                isSelectedDate(date)
                  ? "bg-purple-600 text-white"
                  : "hover:bg-gray-700"
              }`}
            >
              {date?.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: EVENTS */}
      <div className="w-1/2 space-y-3 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold">
          Events for {selectedDate.toDateString()}
        </h2>

        {selectedDateEvents.length === 0 ? (
          <p className="text-gray-400">No events</p>
        ) : (
          selectedDateEvents.map((event) => {
            const status = getEventStatus(event.dueDate);

            return (
              <div
                key={event.id}
                className={`border rounded-lg p-3 ${
                  status === "overdue"
                    ? "border-red-500 bg-red-900/20"
                    : status === "today"
                    ? "border-yellow-500 bg-yellow-900/20"
                    : "border-green-500 bg-green-900/20"
                }`}
              >
                <div className="font-semibold">
                  {event.title}
                </div>

                {/* ✅ DUE DATE */}
                <div className="text-sm text-gray-300 mt-1">
                  Due: {new Date(event.dueDate).toLocaleDateString()}
                </div>

                {/* ✅ STATUS */}
                <div className="text-xs mt-1">
                  {status === "overdue" && (
                    <span className="text-red-400">Overdue</span>
                  )}
                  {status === "today" && (
                    <span className="text-yellow-400">Due Today</span>
                  )}
                  {status === "upcoming" && (
                    <span className="text-green-400">Upcoming</span>
                  )}
                </div>

                {event.clientName && (
                  <div className="text-sm flex items-center gap-1 mt-1">
                    <User size={14} />
                    {event.clientName}
                  </div>
                )}

                {event.stage && (
                  <div className="text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {event.stage}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default CalendarPage;