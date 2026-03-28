"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ReferenceCandidate, ReferenceValue } from "../../lib/reference/model";

interface ReferenceSelectProps {
  candidates: ReferenceCandidate[];
  current: ReferenceValue | undefined;
  hasError?: boolean;
  hasWarning?: boolean;
  /** True when the current refId doesn't match any candidate */
  isInvalid?: boolean;
  style?: CSSProperties;
  onSelect: (candidate: ReferenceCandidate | undefined) => void;
  onNavigateToReference?: (documentId: string, sectionId?: string, fieldId?: string) => void;
  resolvedLabel?: string;
  compact?: boolean;
}

const baseWrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
};

function getInputStyle(hasError: boolean, hasWarning: boolean, isInvalid: boolean): CSSProperties {
  let border = "1px solid #E2E8F0";
  let bg = "#FFFFFF";
  if (isInvalid || hasError) {
    border = "1.5px solid #EF4444";
    bg = "#FFFBFB";
  } else if (hasWarning) {
    border = "1.5px solid #F59E0B";
    bg = "#FFFEF5";
  }
  return {
    width: "100%",
    border,
    borderRadius: "6px",
    padding: "8px 30px 8px 10px",
    fontSize: "0.875rem",
    color: "#0F172A",
    backgroundColor: bg,
    boxSizing: "border-box",
    outline: "none",
  };
}

const dropdownStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  maxHeight: "220px",
  overflowY: "auto",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  zIndex: 50,
  marginTop: "2px",
};

const optionBaseStyle: CSSProperties = {
  padding: "7px 10px",
  fontSize: "0.84rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const clearBtnStyle: CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#94A3B8",
  cursor: "pointer",
  fontSize: "1rem",
  padding: "0 2px",
  lineHeight: 1,
};

const navBtnStyle: CSSProperties = {
  marginTop: "4px",
  border: "none",
  background: "none",
  color: "#2563EB",
  fontSize: "0.7rem",
  cursor: "pointer",
  padding: 0,
};

const invalidBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "0.68rem",
  color: "#EF4444",
  backgroundColor: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: "4px",
  padding: "1px 6px",
  marginTop: "4px",
};

export function ReferenceSelect({
  candidates,
  current,
  hasError = false,
  hasWarning = false,
  isInvalid = false,
  style,
  onSelect,
  onNavigateToReference,
  resolvedLabel,
  compact = false,
}: ReferenceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine the display label for the selected value
  const selectedLabel = useMemo(() => {
    if (!current) return "";
    const match = candidates.find((c) => c.id === current.refId);
    return match?.label ?? resolvedLabel ?? current.refId;
  }, [current, candidates, resolvedLabel]);

  // Filter candidates by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return candidates;
    const lower = query.toLowerCase();
    return candidates.filter((c) => c.label.toLowerCase().includes(lower));
  }, [candidates, query]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered.length]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    const item = items[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  const handleSelect = useCallback(
    (candidate: ReferenceCandidate | undefined) => {
      onSelect(candidate);
      setOpen(false);
      setQuery("");
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filtered.length) {
            handleSelect(filtered[highlightIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          setQuery("");
          break;
      }
    },
    [open, filtered, highlightIndex, handleSelect],
  );

  const inputStyle: CSSProperties = {
    ...getInputStyle(hasError, hasWarning, isInvalid),
    ...(compact ? { padding: "5px 26px 5px 7px", fontSize: "0.825rem", borderRadius: "4px" } : {}),
    ...style,
  };

  return (
    <div ref={wrapperRef} style={baseWrapperStyle}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          style={inputStyle}
          placeholder={current ? selectedLabel : "検索して選択..."}
          value={open ? query : (current ? selectedLabel : "")}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          readOnly={false}
        />
        {current && !open && (
          <button
            type="button"
            style={clearBtnStyle}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(undefined);
              inputRef.current?.focus();
            }}
            title="選択を解除"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div style={dropdownStyle} ref={listRef}>
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#94A3B8" }}>
              {candidates.length === 0 ? "候補がありません" : "一致する候補がありません"}
            </div>
          )}
          {filtered.map((candidate, index) => {
            const isSelected = current?.refId === candidate.id;
            const isHighlighted = index === highlightIndex;
            return (
              <div
                key={candidate.id}
                style={{
                  ...optionBaseStyle,
                  backgroundColor: isHighlighted ? "#EFF6FF" : isSelected ? "#F8FAFC" : "transparent",
                  fontWeight: isSelected ? 600 : 400,
                }}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(candidate);
                }}
              >
                {isSelected && <span style={{ color: "#2563EB", fontSize: "0.75rem", flexShrink: 0 }}>●</span>}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{candidate.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {isInvalid && current && !open && (
        <div style={invalidBadgeStyle}>無効な参照です（参照先が見つかりません）</div>
      )}

      {current && !isInvalid && onNavigateToReference && !open && (
        <button
          type="button"
          style={navBtnStyle}
          onClick={() => onNavigateToReference(current.documentId, current.sectionId, current.fieldId)}
        >
          {resolvedLabel ?? "参照先へ移動"}
        </button>
      )}
    </div>
  );
}
