"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Eye, Globe, FileEdit } from "lucide-react";
import styles from "./chatbot.module.css";

type Bot = {
  id: string;
  name: string;
  description?: string;
  status: string;
  published: boolean;
  updatedAt: string;
};

export default function ChatbotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadBots() {
    setLoading(true);
    const res = await fetch("/api/chatbots");
    const data = await res.json();
    setBots(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadBots();
  }, []);

  // 🔥 DELETE BOT
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this chatbot?")) return;

    const res = await fetch(`/api/chatbots/${id}`, { method: "DELETE" });

    if (res.ok) {
      setBots((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert("Failed to delete chatbot");
    }
  }

  // 🔥 PUBLISH / UNPUBLISH BOT
  async function handlePublish(id: string, publish: boolean) {
    const res = await fetch(`/api/chatbots/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: publish }),
    });

    if (res.ok) {
      loadBots(); // ✅ refresh list
    } else {
      alert("Failed to update publish state");
    }
  }

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatbotMaxWidth}>
        
        {/* Header */}
        <div className={styles.chatbotHeader}>
          <div>
            <div className={styles.chatbotHeaderContent}>
              <div className={styles.chatbotIcon}>
                <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <h1 className={styles.chatbotTitle}>
                Your Chatbots
              </h1>
            </div>
            <p className={styles.chatbotSubtitle}>
              Manage and deploy your AI assistants
            </p>
          </div>
          
          <Link href="/chatbot/new" className={`${styles.chatbotBtn} ${styles.chatbotBtnPrimary}`}>
            <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>Create Chatbot</span>
          </Link>
        </div>

        {/* Stats Bar */}
        <div className={styles.chatbotStats}>
          <div className={styles.chatbotStatCard}>
            <div className={styles.chatbotStatLabel}>Total Bots</div>
            <div className={styles.chatbotStatValue}>{bots.length}</div>
          </div>
          <div className={styles.chatbotStatCard}>
            <div className={styles.chatbotStatLabel}>Published</div>
            <div className={`${styles.chatbotStatValue} ${styles.green}`}>
              {bots.filter(b => b.published).length}
            </div>
          </div>
          <div className={styles.chatbotStatCard}>
            <div className={styles.chatbotStatLabel}>Drafts</div>
            <div className={`${styles.chatbotStatValue} ${styles.amber}`}>
              {bots.filter(b => !b.published).length}
            </div>
          </div>
        </div>

        {/* Bots Grid */}
        {loading ? (
          <div className={styles.chatbotLoading}>
            <div className={styles.chatbotSpinner}></div>
            <p style={{ marginTop: '1rem', color: '#4b5563' }}>Loading your chatbots...</p>
          </div>
        ) : bots.length === 0 ? (
          <div className={styles.chatbotEmpty}>
            <div className={styles.chatbotEmptyIcon}>
              <Sparkles style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
            </div>
            <h3 className={styles.chatbotEmptyTitle}>
              No chatbots yet
            </h3>
            <p className={styles.chatbotEmptyText}>
              Create your first AI assistant to get started
            </p>
            <Link href="/chatbot/new" className={`${styles.chatbotBtn} ${styles.chatbotBtnPrimary}`}>
              <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
              Create Your First Bot
            </Link>
          </div>
        ) : (
          <div className={styles.chatbotGrid}>
            {bots.map((bot) => (
              <div key={bot.id} className={styles.chatbotCard}>
                <div className={styles.chatbotCardAccent}></div>
                
                <div className={styles.chatbotCardContent}>
                  {/* Header */}
                  <div className={styles.chatbotCardHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className={styles.chatbotCardTitle}>
                        {bot.name}
                      </h3>
                      <p className={styles.chatbotCardDesc}>
                        {bot.description || "No description provided"}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`${styles.chatbotBadge} ${bot.published ? styles.published : styles.draft}`}>
                      <span className={`${styles.chatbotBadgeDot} ${bot.published ? styles.green : styles.amber}`}></span>
                      {bot.published ? "Live" : "Draft"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.chatbotActions}>
                    <Link
                      href={`/chatbot/${bot.id}/builder`}
                      className={`${styles.chatbotActionBtn} ${styles.builder}`}
                    >
                      <FileEdit style={{ width: '1rem', height: '1rem' }} />
                      <span>Builder</span>
                    </Link>
                    
                    <Link
                      href={`/chatbot/${bot.id}`}
                      className={`${styles.chatbotActionBtn} ${styles.test}`}
                    >
                      <Eye style={{ width: '1rem', height: '1rem' }} />
                      <span>Test</span>
                    </Link>
                    
                    {bot.published ? (
                      <button
                        onClick={() => handlePublish(bot.id, false)}
                        className={`${styles.chatbotActionBtn} ${styles.unpublish}`}
                      >
                        <Globe style={{ width: '1rem', height: '1rem' }} />
                        <span>Unpublish</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(bot.id, true)}
                        className={`${styles.chatbotActionBtn} ${styles.publish}`}
                      >
                        <Globe style={{ width: '1rem', height: '1rem' }} />
                        <span>Publish</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(bot.id)}
                      className={`${styles.chatbotActionBtn} ${styles.delete}`}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}