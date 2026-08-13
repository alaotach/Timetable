function EmailTimetable({
  email,
  setEmail,
  onSend,
  loading,
}) {
  return (
    <div className="email-card">
      <div className="email-icon">
        ✉️
      </div>

      <div className="email-content">
        <label>
          Email Address
        </label>

        <div className="email-form">
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <button
            className="primary-button"
            onClick={onSend}
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailTimetable;