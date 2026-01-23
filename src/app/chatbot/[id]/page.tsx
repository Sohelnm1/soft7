"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------
   ✅ WhatsApp-style Chat Bubble (Supports Text + Buttons + Images)
---------------------------------------------------------------- */
function ChatBubble({
  msg,
  onSend,
}: {
  msg: any;
  onSend: (text: string) => void;
}) {
  const isBot = msg.role === "bot";

  /* ✅ IMAGE / MEDIA MESSAGE */
  if (msg?.type === "media") {
    return (
      <div className="w-full flex justify-start my-3">
        <div className="bg-white p-3 rounded-2xl rounded-tl-sm max-w-xs shadow-md border border-gray-200">
          
          {msg.text && (
            <div className="mb-2 text-sm text-gray-800">{msg.text}</div>
          )}

          <div className="flex flex-col gap-2">
            {msg.images?.map((img: any, i: number) => (
              <div key={i}>
                <img
                  src={img.url}
                  alt="chat image"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="max-w-full rounded-lg border bg-gray-100"
                />
                {img.caption && (
                  <div className="text-xs text-gray-500 mt-1">
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  /* ✅ Button Message Bubble */
  if (msg?.type === "button") {
    return (
      <div className="w-full flex justify-start my-3">
        <div className="bg-white text-gray-800 p-4 rounded-2xl rounded-tl-sm max-w-xs shadow-md border border-gray-200">
          <div className="mb-3 text-sm">{msg.text}</div>

          <div className="flex flex-col gap-2">
            {msg.buttons.map((btn: string, i: number) => (
              <button
                key={i}
                onClick={() => onSend(btn)}
                className="bg-teal-500 hover:bg-teal-600 transition
                           text-white py-2.5 px-4 rounded-lg text-sm shadow-md font-medium"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ✅ Normal Text Bubble */
  return (
    <div
      className={`w-full flex my-2 ${
        isBot ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`px-4 py-2.5 rounded-2xl max-w-xs text-sm shadow-md
          ${
            isBot
              ? "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
              : "bg-teal-500 text-white rounded-tr-sm"
          }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ✅ MAIN CHAT PAGE
---------------------------------------------------------------- */
export default function ChatbotPage() {
  const { id } = useParams<{ id: string }>();

  const [messages, setMessages] = useState<any[]>([
    { role: "bot", text: "Hi! Ask me anything." },
  ]);

  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  /* ✅ Auto Scroll */
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  /* ---------------------------------------------------------------
     ✅ SEND MESSAGE
  --------------------------------------------------------------- */
  async function sendMessage(userText: string) {
    if (!userText.trim()) return;

    // ✅ Add user message
    setMessages((m) => [...m, { role: "user", text: userText }]);

    const res = await fetch(`/api/chatbots/${id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        sessionKey: "web-session",
      }),
    });

    const data = await res.json();
    let reply = data.reply;

    /* ✅ Backend may send JSON string → parse safely */
    if (typeof reply === "string") {
      try {
        reply = JSON.parse(reply);
      } catch {
        reply = { type: "text", text: reply };
      }
    }

    /* ✅ IMAGE / MEDIA MESSAGE */
    if (reply.type === "media") {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          type: "media",
          text: reply.text,
          images: reply.images || [],
        },
      ]);
      return;
    }

    /* ✅ BUTTON MESSAGE */
    if (reply.type === "button") {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          type: "button",
          text: reply.text,
          buttons: reply.buttons,
        },
      ]);
      return;
    }

    /* ✅ NORMAL TEXT */
    setMessages((m) => [
      ...m,
      { role: "bot", text: reply.text ?? reply },
    ]);
  }

  /* ✅ Send from input box */
  function manualSend() {
    sendMessage(input.trim());
    setInput("");
  }

  /* ---------------------------------------------------------------
     ✅ RENDER UI
  --------------------------------------------------------------- */
  return (
    <div className="flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 h-screen p-4">
      
      {/* ✅ Header */}
      <div className="w-full max-w-lg flex items-center gap-3 mb-4 bg-white rounded-t-xl p-4 shadow-sm border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600"></div>
        <div className="text-lg font-semibold text-gray-800">Chatbot</div>
      </div>

      {/* ✅ Chat Window */}
      <div
        ref={chatRef}
        className="
          w-full max-w-lg h-[70vh]
          bg-gradient-to-b from-gray-100 to-white rounded-xl p-4
          overflow-y-auto shadow-lg border border-gray-200
        "
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} onSend={sendMessage} />
        ))}
      </div>

      {/* ✅ Input Area */}
      <div className="flex w-full max-w-lg mt-4 gap-2 bg-white p-3 rounded-b-xl shadow-sm border-t border-gray-200">
        <input
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && manualSend()}
          className="
            flex-1 bg-gray-100 text-gray-800
            p-3 rounded-xl border border-gray-200 outline-none
            focus:border-teal-500 transition
          "
        />

        <button
          onClick={manualSend}
          className="
            bg-teal-500 hover:bg-teal-600 transition
            px-6 rounded-xl text-white font-semibold shadow-sm
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}
