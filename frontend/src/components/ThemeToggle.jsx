function ThemeToggle({
  darkMode,
  setDarkMode,
}) {
  return (
    <button
      className="theme-toggle"
      onClick={() =>
        setDarkMode((previous) => !previous)
      }
      aria-label="Toggle light and dark mode"
    >
      <span className="theme-toggle-icon">
        {darkMode ? "☀️" : "🌙"}
      </span>

      <span>
        {darkMode
          ? "Light Mode"
          : "Dark Mode"}
      </span>
    </button>
  );
}

export default ThemeToggle;