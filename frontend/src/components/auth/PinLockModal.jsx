import React, { useState, useEffect, useRef } from "react";
import { usePin } from "../../context/PinContext";
import { Shield, Lock, Eye, EyeOff, X, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

export const PinLockModal = () => {
  const { showPinModal, verifyPin, closePinModal, autoLockMinutes } = usePin();

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  // Reset state when modal opens
  useEffect(() => {
    if (showPinModal) {
      setDigits(["", "", "", ""]);
      setError("");
      setShake(false);
      setShowPin(false);
      setSuccess(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [showPinModal]);

  // Auto-submit when all 4 digits filled
  useEffect(() => {
    if (digits.every((d) => d !== "")) {
      handleVerify(digits.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const handleVerify = (pinStr) => {
    const ok = verifyPin(pinStr);
    if (ok) {
      setSuccess(true);
      setError("");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(
        newAttempts >= 3
          ? `❌ Wrong PIN (${newAttempts} attempts). Double check and try again.`
          : "❌ Incorrect PIN. Please try again."
      );
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setDigits(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }, 600);
    }
  };

  const handleDigitChange = (index, value) => {
    // Accept only digits
    const v = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = v;
    setDigits(newDigits);
    setError("");
    if (v && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "Enter" && digits.every((d) => d !== "")) {
      handleVerify(digits.join(""));
    }
  };

  const handleNumpadClick = (num) => {
    const emptyIndex = digits.findIndex((d) => d === "");
    if (emptyIndex === -1) return;
    const newDigits = [...digits];
    newDigits[emptyIndex] = String(num);
    setDigits(newDigits);
    setError("");
  };

  const handleNumpadDelete = () => {
    const lastFilledIndex = [...digits].reverse().findIndex((d) => d !== "");
    if (lastFilledIndex === -1) return;
    const realIndex = 3 - lastFilledIndex;
    const newDigits = [...digits];
    newDigits[realIndex] = "";
    setDigits(newDigits);
    setError("");
  };

  if (!showPinModal) return null;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="pin-modal-backdrop"
        onClick={closePinModal}
        aria-label="Close PIN modal"
      />

      {/* ── Modal Card ──────────────────────────────────────────────────── */}
      <div className={`pin-modal-card ${shake ? "pin-shake" : ""} ${success ? "pin-success-card" : ""}`}>

        {/* Close button */}
        <button className="pin-close-btn" onClick={closePinModal} aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pin-header">
          <div className={`pin-icon-ring ${success ? "pin-icon-ring--success" : ""}`}>
            {success ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <Shield className="w-8 h-8 text-blue-400" />
            )}
          </div>
          <h2 className="pin-title">
            {success ? "Access Granted!" : "Admin ERP Access"}
          </h2>
          <p className="pin-subtitle">
            {success
              ? "Redirecting to dashboard..."
              : `Enter your 4-digit Super Admin PIN to continue. Auto-locks after ${autoLockMinutes} min of inactivity.`}
          </p>
        </div>

        {!success && (
          <>
            {/* PIN Digit Boxes */}
            <div className="pin-digit-row">
              {digits.map((d, i) => (
                <div key={i} className="pin-digit-wrapper">
                  <input
                    ref={(el) => (inputRefs.current[i] = el)}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`pin-digit-input ${d ? "pin-digit-filled" : ""} ${error ? "pin-digit-error" : ""}`}
                    autoComplete="off"
                    aria-label={`PIN digit ${i + 1}`}
                  />
                  <div className={`pin-digit-dot ${d ? "active" : ""} ${showPin ? "hidden" : ""}`} />
                </div>
              ))}
            </div>

            {/* Show/Hide toggle */}
            <button
              className="pin-show-toggle"
              onClick={() => setShowPin(!showPin)}
              type="button"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? "Hide PIN" : "Show PIN"}</span>
            </button>

            {/* Error message */}
            {error && (
              <div className="pin-error-box">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numpad */}
            <div className="pin-numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  className="pin-numpad-btn"
                  onClick={() => handleNumpadClick(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                className="pin-numpad-btn"
                onClick={() => handleNumpadClick(0)}
                type="button"
              >
                0
              </button>
              <button
                className="pin-numpad-btn pin-numpad-del"
                onClick={handleNumpadDelete}
                type="button"
                aria-label="Delete"
              >
                ⌫
              </button>
            </div>

            {/* Hint */}
            <div className="pin-hint">
              <Lock className="w-3 h-3" />
              <span>Only Super Admin can access the ERP dashboard</span>
            </div>
          </>
        )}
      </div>
    </>
  );
};
