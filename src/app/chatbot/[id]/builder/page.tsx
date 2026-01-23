"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import styles from "../../chatbot.module.css";

// ✅ Load BuilderCanvas client-side only
const BuilderCanvas = dynamic(
  () => import("@/components/builder/BuilderCanvas"),
  { ssr: false }
);

export default function BuilderPage(props: { params: Promise<{ id: string }> }) {
  // ✅ Unwrap params using React.use()
  const { id } = use(props.params);

  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/chatbots/${id}`)
      .then((res) => res.json())
      .then((data) => setBot(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.chatbotContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className={styles.chatbotLoading}>
          <div style={{ position: 'relative', width: '4rem', height: '4rem', margin: '0 auto 1rem' }}>
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              borderRadius: '50%', 
              background: 'linear-gradient(to right, #3b82f6, #6366f1)', 
              opacity: 0.2, 
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' 
            }}></div>
            <div style={{ 
              position: 'relative', 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%', 
              background: 'linear-gradient(to right, #3b82f6, #6366f1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Loader2 style={{ width: '2rem', height: '2rem', color: 'white', animation: 'spin 1s linear infinite' }} />
            </div>
          </div>
          <p style={{ color: '#4b5563', fontWeight: 500 }}>Loading builder...</p>
        </div>
      </div>
    );
  }

  if (!bot?.id) {
    return (
      <div className={styles.chatbotContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className={styles.chatbotError}>
          <div className={styles.chatbotErrorIcon}>
            <span>⚠️</span>
          </div>
          <h2 className={styles.chatbotErrorTitle}>
            Chatbot Not Found
          </h2>
          <p className={styles.chatbotErrorText}>
            The chatbot you're looking for doesn't exist or has been deleted.
          </p>
          <a
            href="/chatbot"
            className={`${styles.chatbotBtn} ${styles.chatbotBtnPrimary}`}
          >
            Back to Chatbots
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <BuilderCanvas bot={bot} />
    </div>
  );
}