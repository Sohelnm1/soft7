import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App"; // or your main component path
import "./globals.css"; // make sure this exists

function Main() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <App />
      </div>

      {/* TEMP button to test theme switch */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
      >
        Toggle Theme
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
