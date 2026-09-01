import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  GraduationCap,
  Cake,
  AlertCircle,
  ExternalLink,
  X,
  Check,
} from "lucide-react";
import api from "../../api/axios";

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Fast poll every 5 seconds for real-time admin notifications
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      if (notification.link.includes("/dashboard/students")) {
        window.open(notification.link, "_blank");
      } else {
        navigate(notification.link);
      }
    }
  };


  const filteredNotifications = notifications.filter((n) => {
    if (filter === "INQUIRY") return n.type === "NEW_INQUIRY";
    if (filter === "STUDENT") return n.type === "NEW_STUDENT";
    if (filter === "BIRTHDAY") return n.type === "STUDENT_BIRTHDAY";
    return true;
  });

  const getIconAndColor = (type) => {
    switch (type) {
      case "NEW_INQUIRY":
        return {
          icon: MessageSquare,
          bg: "bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400",
        };
      case "NEW_STUDENT":
        return {
          icon: GraduationCap,
          bg: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400",
        };
      case "STUDENT_BIRTHDAY":
        return {
          icon: Cake,
          bg: "bg-pink-50 dark:bg-pink-950/80 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400",
        };
      default:
        return {
          icon: AlertCircle,
          bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300",
        };
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm cursor-pointer active:scale-95"
        title="Admin Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-lg shadow-rose-900 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-[9999] overflow-hidden ring-1 ring-slate-900/10 dark:ring-slate-700/50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-cyan-950 text-blue-800 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-1 text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 px-2 py-1 rounded-lg bg-blue-50 dark:bg-cyan-950/50 hover:bg-blue-100 dark:hover:bg-cyan-900/50 border border-blue-200 dark:border-cyan-800/50 transition cursor-pointer active:scale-95"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read All</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 px-3 py-2 bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-[11px] font-semibold">
            {[
              { id: "ALL", label: "All" },
              { id: "INQUIRY", label: "Inquiries" },
              { id: "STUDENT", label: "Students" },
              { id: "BIRTHDAY", label: "Birthdays 🎂" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer active:scale-95 ${
                  filter === tab.id
                    ? "bg-blue-600 dark:bg-cyan-600 text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600 opacity-60" />
                No notifications found.
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const { icon: ItemIcon, bg: iconBg } = getIconAndColor(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                      item.isRead
                        ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        : "bg-blue-50/70 dark:bg-slate-800/90 hover:bg-blue-100/60 dark:hover:bg-slate-800 border-l-4 border-blue-600 dark:border-cyan-500"
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div className={`p-2 rounded-xl border ${iconBg} shrink-0 mt-0.5`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold truncate ${
                            item.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 ml-2">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Mark Read Checkbox button */}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition shrink-0 cursor-pointer active:scale-95"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
