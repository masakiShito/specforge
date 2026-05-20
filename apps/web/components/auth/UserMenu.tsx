"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth";

export function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          backgroundColor: isOpen ? "#F1F5F9" : "transparent",
          border: "1px solid #E2E8F0",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "#374151",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = "#F8FAFC";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#3B82F6",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.name}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            minWidth: "180px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "#0F172A" }}>
              {user.name}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748B" }}>
              {user.email}
            </p>
          </div>
          <div style={{ padding: "4px" }}>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                color: "#DC2626",
                textAlign: "left",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FEE2E2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {isLoading ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
