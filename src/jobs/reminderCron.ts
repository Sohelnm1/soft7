// import cron from "node-cron";
// import fetch from "node-fetch";

// const CRON_URL = `${process.env.NGROK_URL}/api/contact-reminders/run`;

// cron.schedule("*/1 * * * *", async () => {
//   console.log("⏳ Running reminder check...");

//   try {
//     const res = await fetch(CRON_URL);
//     const data = await res.json();

//     console.log("Reminder result:", data);
//   } catch (err) {
//     console.error("Cron error:", err);
//   }
// });
