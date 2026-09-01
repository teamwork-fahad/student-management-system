import React, { useState, useEffect } from "react";
import { Cake, Gift, Calendar, Phone, Mail, Sparkles, RefreshCw, ChevronRight, PartyPopper } from "lucide-react";
import api from "../../api/axios";

export const UpcomingBirthdaysWidget = () => {
  const [students, setStudents] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [daysWindow, setDaysWindow] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBirthdays = async (days = daysWindow) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/notifications/birthdays/upcoming?days=${days}&_t=${Date.now()}`);
      const payload = res.data?.data || res.data?.message || {};
      const studentList = Array.isArray(payload) ? payload : (payload.students || []);
      setStudents(studentList);
      setTodayCount(payload.todayCount || studentList.filter(s => s.isToday).length || 0);
    } catch (err) {
      console.error("Failed to fetch upcoming birthdays:", err);
      setError("Unable to load birthday schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays(daysWindow);
  }, [daysWindow]);

  const handleWhatsAppWish = (student) => {
    const mobileClean = (student.mobile || "").replace(/\D/g, "");
    if (!mobileClean) return;
    const phoneWithCountry = mobileClean.length === 10 ? `91${mobileClean}` : mobileClean;
    const msg = `🎉 Happy Birthday ${student.fullName}! 🎂 Best wishes from all of us at AppXwinD Technology! Have a wonderful day filled with joy and success! 🌟`;
    const text = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${text}`, "_blank");
  };

  const todayBirthdays = students.filter((s) => s.isToday);
  const upcomingBirthdays = students.filter((s) => !s.isToday);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm font-sans transition-all">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 shrink-0">
            <Cake className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Student Birthdays &amp; Wish Hub
              </h3>
              {todayCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 animate-pulse">
                  {todayCount} Today 🎈
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Track celebrations &amp; send instant greetings
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDaysWindow(7)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                daysWindow === 7
                  ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Next 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDaysWindow(30)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                daysWindow === 30
                  ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Next 30 Days
            </button>
          </div>
          <button
            type="button"
            onClick={() => fetchBirthdays(daysWindow)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-pink-500" />
          Loading upcoming birthdays...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs text-rose-500">{error}</div>
      ) : (
        <div className="space-y-6 mt-5">
          {/* TODAY'S CELEBRATION SECTION */}
          {todayBirthdays.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-amber-500/10 border-2 border-pink-500/30 dark:border-pink-500/40">
              <div className="flex items-center space-x-2 text-pink-600 dark:text-pink-400 font-black text-xs uppercase tracking-wider mb-3">
                <PartyPopper className="w-4 h-4" />
                <span>Today's Birthday Celebrations ({todayBirthdays.length})</span>
                <Sparkles className="w-4 h-4 ml-auto text-amber-500 animate-spin" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayBirthdays.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-pink-200 dark:border-pink-900/50 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {student.fullName}
                          </h4>
                          <p className="text-[11px] font-mono text-pink-600 dark:text-pink-400 font-semibold mt-0.5">
                            ID: {student.studentId || "N/A"} &middot; Turning {student.turningAge} 🎂
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white uppercase tracking-wider shadow-xs">
                          Today
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {student.mobile || "No Mobile"}
                      </span>
                      <div className="flex items-center space-x-2">
                        {student.mobile && (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppWish(student)}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Wish WhatsApp</span>
                          </button>
                        )}
                        {student.email && (
                          <a
                            href={`mailto:${student.email}?subject=Happy%20Birthday%20${encodeURIComponent(
                              student.fullName
                            )}!&body=Wishing%20you%20a%20very%20Happy%20Birthday!`}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                            title="Send Email Wish"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING BIRTHDAYS LIST */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Upcoming Birthdays (Next {daysWindow} Days)</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono font-medium">
                {upcomingBirthdays.length} student{upcomingBirthdays.length === 1 ? "" : "s"}
              </span>
            </div>

            {upcomingBirthdays.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No upcoming birthdays in the next {daysWindow} days.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
                {upcomingBirthdays.map((student) => (
                  <div
                    key={student.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0">
                        {new Date(student.dob).getDate()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {student.fullName}
                          </h5>
                          {student.status === "COMPLETED" && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              Graduated
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                            {student.studentId || "N/A"}
                          </span>
                          &nbsp;&middot;&nbsp;{student.nextBirthdayDate} (Turning {student.turningAge})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          student.daysUntil === 1
                            ? "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {student.daysUntilText}
                      </span>
                      {student.mobile && (
                        <button
                          type="button"
                          onClick={() => handleWhatsAppWish(student)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 transition cursor-pointer active:scale-95"
                          title="WhatsApp Wish"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
