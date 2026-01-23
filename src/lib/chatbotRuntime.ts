export async function runChatbot(bot, userInput, sessionKey) {
  const nodes = bot.nodes;
  const edges = bot.edges;

  const findNode = (id) => nodes.find((n) => n.id === id);

  // ✅ Find start node (Trigger node)
  const start = nodes.find((n) => n.type === "trigger");
  if (!start) return null;

  let current = start;

  while (true) {
    if (current.type === "message") {
      return current.data.text; // simple reply
    }

    if (current.type === "ai") {
      const prompt = current.data.prompt || "Respond:";
      const reply = await callOpenAI(prompt + "\nUser: " + userInput);
      return reply;
    }

    // next node
    const link = edges.find((e) => e.source === current.id);
    if (!link) return null;

    current = findNode(link.target);
  }
}

async function callOpenAI(text: string) {
  const key = process.env.OPENAI_API_KEY;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    }),
  });

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "…";
}
