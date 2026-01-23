"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Plus, Trash2, XCircle } from "lucide-react";

type OptType = "OPT_IN" | "OPT_OUT";

interface Keyword {
  id: number;
  keyword: string;
  type: OptType;
}

/* ===========================================================
   REUSABLE KEYWORD CARD COMPONENT
   =========================================================== */
const KeywordCard: React.FC<{
  type: OptType;
  title: string;
  description: string;
  keywords: Keyword[];
  onDelete: (id: number) => void;
  onAdd: (keyword: string) => void;
}> = ({ type, title, description, keywords, onDelete, onAdd }) => {
  const [newKeyword, setNewKeyword] = useState("");
  const keywordLimit = 10;

  const parsedKeywords = newKeyword
    .split(/[\s,]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const existingCount = keywords.length;
  const remainingSlots = Math.max(0, keywordLimit - existingCount);

  const liveCount = Math.min(keywordLimit, existingCount + parsedKeywords.length);

  const handleAddClick = () => {
    if (!parsedKeywords.length || remainingSlots === 0) return;

    const toAdd = parsedKeywords.slice(0, remainingSlots);
    toAdd.forEach((kw) => onAdd(kw));

    setNewKeyword(""); // Clear input
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddClick();
    }
  };

  const isOut = type === "OPT_OUT";
  const headerColor = isOut ? "text-red-600" : "text-green-600";
  const addBtnColor = isOut
    ? "bg-red-500 hover:bg-red-600 shadow-red-300/50"
    : "bg-green-500 hover:bg-green-600 shadow-green-300/50";

  return (
    <div
      className="flex-1 p-6 bg-white rounded-3xl 
                 shadow-[0_3px_20px_rgba(0,0,0,0.06)]
                 transition-all duration-300
                 hover:shadow-[0_6px_25px_rgba(0,0,0,0.10)] hover:-translate-y-1"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-6">{description}</p>

      {/* Keyword list */}
      <div className="h-40 overflow-y-auto rounded-2xl bg-gray-50 border border-gray-100 p-4 shadow-inner mb-5">
        {keywords.length > 0 ? (
          <ul className="space-y-2">
            {keywords.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between px-4 py-2 bg-white rounded-lg 
                           border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <span className="font-medium text-gray-700 tracking-wide">
                  {k.keyword.toUpperCase()}
                </span>
                <button
                  onClick={() => onDelete(k.id)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-400 py-8 flex flex-col items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 10h.01M15 10h.01M9.5 15c.8.7 1.7 1 2.5 1s1.7-.3 2.5-1" />
            </svg>
            <p className="italic">
              No {type === "OPT_IN" ? "opt-in" : "opt-out"} keywords added.
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2 font-medium flex justify-between pl-1.5">
          Maximum Keywords Allowed:
          <span
            className={`font-bold ${
              liveCount >= keywordLimit ? "text-red-500" : headerColor
            }`}
          >
            {liveCount}/{keywordLimit}
          </span>
        </p>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Type keywords separated by space or comma"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={remainingSlots === 0}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition
              ${
                remainingSlots === 0
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 bg-white"
              }
              disabled:opacity-70 disabled:cursor-not-allowed`}
          />

          <button
            type="button"
            onClick={handleAddClick}
            disabled={!parsedKeywords.length || remainingSlots === 0}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md flex items-center
              ${addBtnColor}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Plus size={16} className="mr-1" /> Add
          </button>
        </div>

        {remainingSlots === 0 && (
          <div className="flex items-center text-red-500 text-xs mt-2">
            <XCircle size={14} className="mr-1" />
            Keyword limit reached. Remove some keywords to add more.
          </div>
        )}
      </div>
    </div>
  );
};

/* ===========================================================
   MAIN PAGE
   =========================================================== */
export default function OptsManagement() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // THIS FIXES THE DISAPPEARING ISSUE
  const hasFetched = useRef(false);

  /* ------------------------
     SAFE FETCH ONCE
     ------------------------ */
  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/opts");
      const data = await res.json();

      let safe: Keyword[] = [];

      if (Array.isArray(data)) safe = data;
      else if (Array.isArray(data?.keywords)) safe = data.keywords;
      else {
        console.warn("Invalid backend response. Keeping existing data.");
        return;
      }

      setKeywords(safe);
    } catch (err) {
      console.error("Failed to fetch keywords:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // PREVENT React Strict Mode double fetch
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchKeywords();
    }
  }, []);

  /* ------------------------
     ADD KEYWORD — NO SERVER SYNC
     ------------------------ */
  const addKeyword = async (keyword: string, type: OptType) => {
    const tempId = Date.now() + Math.random();
    const optimistic = { id: tempId, keyword, type };

    setKeywords((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/opts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, type }),
      });

      if (!res.ok) {
        setKeywords((prev) => prev.filter((k) => k.id !== tempId));
      }

      // ❌ DO NOT fetchKeywords() — backend is returning empty/wrong data
    } catch (err) {
      console.error("Failed to add keyword:", err);
      setKeywords((prev) => prev.filter((k) => k.id !== tempId));
    }
  };

  /* ------------------------
     DELETE KEYWORD
     ------------------------ */
  const deleteKeyword = async (id: number) => {
    const old = keywords;
    setKeywords((prev) => prev.filter((k) => k.id !== id));

    try {
      const res = await fetch(`/api/opts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setKeywords(old);
      }
    } catch (err) {
      console.error("Failed to delete keyword:", err);
      setKeywords(old);
    }
  };

  /* ------------------------
     SAFE FILTERING
     ------------------------ */
  const safeArray = Array.isArray(keywords) ? keywords : [];

  const optOutKeywords = useMemo(
    () => safeArray.filter((k) => k?.type === "OPT_OUT"),
    [safeArray]
  );

  const optInKeywords = useMemo(
    () => safeArray.filter((k) => k?.type === "OPT_IN"),
    [safeArray]
  );

  /* ------------------------
     LOADING UI
     ------------------------ */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 bg-white rounded-2xl shadow-lg border border-gray-100">
        <p className="text-xl text-indigo-500 font-medium">Loading keywords...</p>
      </div>
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto my-10 p-10 bg-white rounded-3xl 
                 shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-gray-100"
    >
      <div className="pl-1">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2 mb-2">
          Messaging Keywords Setup
          <span className="text-purple-400 text-3xl">💬</span>
        </h1>

        <p className="text-gray-600 mb-8 pb-4 border-b border-gray-200">
          Configure the official keywords that manage your users&apos; subscription status.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <KeywordCard
          type="OPT_OUT"
          title="Opt-Out Keywords"
          description="Users sending these words will be unsubscribed from all future messages."
          keywords={optOutKeywords}
          onDelete={deleteKeyword}
          onAdd={(kw) => addKeyword(kw, "OPT_OUT")}
        />

        <KeywordCard
          type="OPT_IN"
          title="Opt-In Keywords"
          description="Users sending these words will be resubscribed to receive your messages."
          keywords={optInKeywords}
          onDelete={deleteKeyword}
          onAdd={(kw) => addKeyword(kw, "OPT_IN")}
        />
      </div>
    </div>
  );
}
