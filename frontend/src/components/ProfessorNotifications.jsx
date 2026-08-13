function ProfessorNotifications({
  professors = [],
  selectedProfessors = [],
  sendingProfEmails = false,
  profDirectoryStatus = "",
  onFileUpload,
  onToggleProfessor,
  onSend,
}) {
  return (
    <div className="professor-container">

      {/* =====================================================
          UPLOAD PROFESSOR FILE
      ===================================================== */}

      <div className="upload-area">

        <div className="upload-icon">
          📁
        </div>

        <div className="upload-content">

          <label>
            Upload Professor JSON or CSV File
          </label>

          <p>
            Upload your professor directory
            to send individual schedules.
          </p>

          <input
            className="file-input"
            type="file"
            accept=".json,.csv"
            onChange={onFileUpload}
          />

        </div>

      </div>


      {/* =====================================================
          STATUS
      ===================================================== */}

      {profDirectoryStatus && (
        <div
          className={
            profDirectoryStatus.startsWith("✅")
              ? "status-message success"
              : "status-message error"
          }
        >
          {profDirectoryStatus}
        </div>
      )}


      {/* =====================================================
          PROFESSOR LIST
      ===================================================== */}

      <div className="professor-list">

        {professors.length === 0 ? (

          <div className="empty-professors">

            <div className="empty-professors-icon">
              👨‍🏫
            </div>

            <p>
              No professors found.
            </p>

            <span>
              Upload a CSV or JSON file above.
            </span>

          </div>

        ) : (

          <>

            {/* Header */}

            <div className="professor-list-header">

              <span>
                Professors
              </span>

              <span>
                {selectedProfessors.length} selected
              </span>

            </div>


            {/* Professors */}

            {professors.map(
              (professor, index) => {

                const isSelected =
                  selectedProfessors.includes(
                    professor.name
                  );

                return (
                  <label
                    className={
                      isSelected
                        ? "professor-item selected"
                        : "professor-item"
                    }
                    key={
                      professor.prof_id ||
                      professor.email ||
                      index
                    }
                  >

                    {/* Checkbox */}

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        onToggleProfessor(
                          professor.name
                        )
                      }
                    />


                    {/* Avatar */}

                    <span className="professor-avatar">
                      {professor.name
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
                    </span>


                    {/* Information */}

                    <span className="professor-info">

                      <strong>
                        {professor.name ||
                          "Unknown Professor"}
                      </strong>

                      <small>
                        {professor.email ||
                          "No email provided"}
                      </small>

                    </span>

                  </label>
                );
              }
            )}

          </>

        )}

      </div>


      {/* =====================================================
          SEND BUTTON
      ===================================================== */}

      <button
        className="primary-button professor-send-button"
        onClick={onSend}
        disabled={sendingProfEmails}
      >
        {sendingProfEmails
          ? "⏳ Sending..."
          : "📨 Send Prof-Specific Timetables"}
      </button>

    </div>
  );
}

export default ProfessorNotifications;