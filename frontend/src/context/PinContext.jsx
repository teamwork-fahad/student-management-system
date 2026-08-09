import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

// ─── Default PIN (Super Admin can change this) ───────────────────────────────
const DEFAULT_PIN = "3242";
const PIN_STORAGE_KEY = "erp_admin_pin";
const PIN_UNLOCKED_KEY = "erp_pin_unlocked_at";
const AUTO_LOCK_MINUTES = 5; // Lock after 5 minutes of inactivity

const PinContext = createContext(null);

export const PinProvider = ({ children }) => {
  // Load saved PIN from localStorage (super admin can update)
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  });

  // Is the ERP currently unlocked?
  const [isPinUnlocked, setIsPinUnlocked] = useState(() => {
    const unlockedAt = localStorage.getItem(PIN_UNLOCKED_KEY);
    if (!unlockedAt) return false;
    const elapsed = (Date.now() - parseInt(unlockedAt, 10)) / 1000 / 60;
    return elapsed < AUTO_LOCK_MINUTES;
  });

  // Show PIN modal?
  const [showPinModal, setShowPinModal] = useState(false);

  // Callback to call after successful unlock
  const onUnlockCallback = useRef(null);

  const autoLockTimerRef = useRef(null);

  // ── Start / reset auto-lock timer ──────────────────────────────────────────
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    autoLockTimerRef.current = setTimeout(() => {
      setIsPinUnlocked(false);
      localStorage.removeItem(PIN_UNLOCKED_KEY);
    }, AUTO_LOCK_MINUTES * 60 * 1000);
  }, []);

  // ── When unlocked, start the timer and watch user activity ────────────────
  useEffect(() => {
    if (!isPinUnlocked) return;

    resetAutoLockTimer();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => {
      localStorage.setItem(PIN_UNLOCKED_KEY, Date.now().toString());
      resetAutoLockTimer();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [isPinUnlocked, resetAutoLockTimer]);

  // ── Request PIN unlock (call this before navigating to dashboard) ──────────
  const requestPinUnlock = useCallback((callback) => {
    if (isPinUnlocked) {
      // Already unlocked – go straight
      callback && callback();
      return;
    }
    onUnlockCallback.current = callback;
    setShowPinModal(true);
  }, [isPinUnlocked]);

  // ── Verify PIN submitted by user ──────────────────────────────────────────
  const verifyPin = useCallback(
    (enteredPin) => {
      if (enteredPin === adminPin) {
        setIsPinUnlocked(true);
        localStorage.setItem(PIN_UNLOCKED_KEY, Date.now().toString());
        setShowPinModal(false);
        onUnlockCallback.current && onUnlockCallback.current();
        onUnlockCallback.current = null;
        return true;
      }
      return false;
    },
    [adminPin]
  );

  // ── Lock manually ──────────────────────────────────────────────────────────
  const lockPin = useCallback(() => {
    setIsPinUnlocked(false);
    localStorage.removeItem(PIN_UNLOCKED_KEY);
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
  }, []);

  // ── Change PIN (super admin) ───────────────────────────────────────────────
  const changePin = useCallback((newPin) => {
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    setAdminPin(newPin);
  }, []);

  // ── Close modal without unlocking ─────────────────────────────────────────
  const closePinModal = useCallback(() => {
    setShowPinModal(false);
    onUnlockCallback.current = null;
  }, []);

  return (
    <PinContext.Provider
      value={{
        isPinUnlocked,
        showPinModal,
        adminPin,
        autoLockMinutes: AUTO_LOCK_MINUTES,
        requestPinUnlock,
        verifyPin,
        lockPin,
        changePin,
        closePinModal,
      }}
    >
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error("usePin must be used inside PinProvider");
  return ctx;
};
