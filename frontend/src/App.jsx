import React, { useState } from "react";

import "./App.css";

import ThemeToggle from "./components/ThemeToggle";
import CourseLoads from "./components/CourseLoads";
import ScheduleSettings from "./components/ScheduleSettings";
import EmailTimetable from "./components/EmailTimetable";
import ProfessorNotifications from "./components/ProfessorNotifications";
import Timetable from "./components/Timetable";

import {
  generateTimetableData,
  extractAndFormatProfSchedule,
  formatTimetableText,
} from "./utils/timetableUtils";

import { generatePDF } from "./utils/pdfGenerator";

import {
  sendFullTimetableEmail,
  sendProfessorTimetableEmail,
} from "./services/emailService";

function App() {
  /* =========================================================
     THEME
  ========================================================= */

  const [darkMode, setDarkMode] = useState(true);

  /* =========================================================
     COURSE STATE
  ========================================================= */

  const [courseLoads, setCourseLoads] = useState([
    {
      batch: "",
      course: "",
      prof: "",
      credit: 0,
    },
  ]);

  /* =========================================================
     SCHEDULE STATE
  ========================================================= */

  const [days, setDays] = useState([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);

  const [slots, setSlots] = useState([
    "9AM",
    "10AM",
    "11AM",
    "1PM",
    "2PM",
  ]);

  const [roomsAvailable, setRoomsAvailable] = useState(3);

  /* =========================================================
     TIMETABLE STATE
  ========================================================= */

  const [timetable, setTimetable] = useState(null);

  const [loading, setLoading] = useState(false);

  /* =========================================================
     EMAIL STATE
  ========================================================= */

  const [email, setEmail] = useState("");

  /* =========================================================
     PROFESSOR STATE
  ========================================================= */

  const [professors, setProfessors] = useState([]);

  const [selectedProfessors, setSelectedProfessors] =
    useState([]);

  const [sendingProfEmails, setSendingProfEmails] =
    useState(false);

  const [profDirectoryStatus, setProfDirectoryStatus] =
    useState("");

  /* =========================================================
     COURSE HANDLERS
  ========================================================= */

  const handleCourseChange = (
    index,
    field,
    value
  ) => {
    setCourseLoads((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  const addCourseRow = () => {
    setCourseLoads((previous) => [
      ...previous,
      {
        batch: "",
        course: "",
        prof: "",
        credit: 0,
      },
    ]);
  };

  /* =========================================================
     GENERATE TIMETABLE
  ========================================================= */

  const handleGenerateTimetable = () => {
    try {
      setLoading(true);

      const generatedTimetable =
        generateTimetableData({
          courseLoads,
          days,
          slots,
          roomsAvailable,
        });

      setTimetable(generatedTimetable);

      generatePDF(
        generatedTimetable,
        roomsAvailable
      );

      alert(
        "Timetable generated successfully!\nPDF downloaded."
      );
    } catch (error) {
      console.error(
        "Timetable generation error:",
        error
      );

      alert(
        "Something went wrong generating the timetable."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FULL TIMETABLE EMAIL
  ========================================================= */

  const handleSendTimetableEmail = async () => {
    if (!email) {
      alert("Please enter email address");
      return;
    }

    if (!timetable) {
      alert("Generate timetable first.");
      return;
    }

    try {
      setLoading(true);

      const timetableText =
        formatTimetableText(timetable);

      await sendFullTimetableEmail(
        email,
        timetableText
      );

      alert(
        "✅ Timetable email successfully sent!"
      );
    } catch (error) {
      console.error(
        "Email Error:",
        error
      );

      alert(
        "❌ Failed to send email. Check console."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PROFESSOR SELECTION
  ========================================================= */

  const toggleProfessorSelection = (name) => {
    setSelectedProfessors((previous) =>
      previous.includes(name)
        ? previous.filter(
            (professor) =>
              professor !== name
          )
        : [...previous, name]
    );
  };

  /* =========================================================
     PROFESSOR FILE UPLOAD
  ========================================================= */

  const handleProfessorFileUpload = async (
    event
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setProfDirectoryStatus(
        "Processing file..."
      );

      const text = await file.text();

      let parsedProfessors = [];

      if (
        file.name
          .toLowerCase()
          .endsWith(".csv")
      ) {
        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          throw new Error(
            "CSV file is empty or missing headers."
          );
        }

        const headers = lines[0]
          .split(",")
          .map((header) =>
            header.trim().toLowerCase()
          );

        parsedProfessors =
          lines.slice(1).map((line) => {
            const values = line
              .split(",")
              .map((value) =>
                value.trim()
              );

            const row = {};

            headers.forEach(
              (header, index) => {
                row[header] =
                  values[index] || "";
              }
            );

            return {
              name:
                row.name ||
                row.professor ||
                row.prof_name ||
                "Unknown",

              email:
                row.email || "",

              prof_id:
                row.prof_id ||
                row.id ||
                "",
            };
          });
      } else {
        const rawJson =
          JSON.parse(text);

        parsedProfessors =
          rawJson.map((item) => ({
            name:
              item.name ||
              item.professor ||
              "Unknown",

            email:
              item.email || "",

            prof_id: String(
              item.prof_id ||
                item.Prof_Id ||
                item.id ||
                ""
            ),
          }));
      }

      setProfessors(parsedProfessors);

      setProfDirectoryStatus(
        `✅ Successfully loaded ${parsedProfessors.length} professor(s).`
      );
    } catch (error) {
      console.error(
        "File upload error:",
        error
      );

      setProfDirectoryStatus(
        "❌ Failed to parse file. Ensure valid CSV or JSON format."
      );
    } finally {
      event.target.value = "";
    }
  };

  /* =========================================================
     PROFESSOR-SPECIFIC EMAILS
  ========================================================= */

  const handleSendProfessorEmails =
    async () => {
      if (!timetable) {
        alert(
          "Generate the timetable first."
        );

        return;
      }

      if (
        selectedProfessors.length === 0
      ) {
        alert(
          "Select at least one professor."
        );

        return;
      }

      const targets =
        professors.filter((professor) =>
          selectedProfessors.includes(
            professor.name
          )
        );

      setSendingProfEmails(true);

      let sentCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const target of targets) {
        if (!target.email) {
          console.warn(
            `Skipping ${target.name}: No email address provided.`
          );

          skippedCount++;

          continue;
        }

        const scheduleText =
          extractAndFormatProfSchedule(
            timetable,
            target.name
          );

        try {
          await sendProfessorTimetableEmail(
            target.email,
            target.name,
            scheduleText
          );

          sentCount++;
        } catch (error) {
          console.error(
            `Failed sending to ${target.name} (${target.email}):`,
            error
          );

          failedCount++;
        }
      }

      setSendingProfEmails(false);

      if (
        failedCount === 0 &&
        skippedCount === 0
      ) {
        alert(
          `✅ Successfully sent individual timetables to ${sentCount} professor(s)!`
        );
      } else {
        alert(
          `⚠️ Bulk Email Complete:\n\n` +
            `• Sent: ${sentCount}\n` +
            `• Failed: ${failedCount}\n` +
            `• Skipped (no email): ${skippedCount}\n\n` +
            `Check browser console for detailed logs.`
        );
      }
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={
        darkMode
          ? "app dark-theme"
          : "app light-theme"
      }
    >
      {/* Theme */}

      <ThemeToggle
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Header */}

      <header className="app-header">
        <div className="header-badge">
          SMART ACADEMIC PLANNING
        </div>

        <h1>Timetable Scheduler</h1>

        <p className="header-subtitle">
          Smart scheduling made simple
        </p>
      </header>

      {/* Main */}

      <main className="dashboard">
        {/* Course Loads */}

        <section className="dashboard-section course-section">
          <div className="section-heading">
            <span className="section-icon">
              📚
            </span>

            <div>
              <h2>Course Loads</h2>

              <p>
                Add courses, batches and
                professors
              </p>
            </div>
          </div>

          <CourseLoads
            courseLoads={courseLoads}
            onCourseChange={
              handleCourseChange
            }
            onAddCourse={
              addCourseRow
            }
          />
        </section>

        {/* Schedule Settings */}

        <section className="dashboard-section">
          <div className="section-heading">
            <span className="section-icon">
              ⚙️
            </span>

            <div>
              <h2>
                Schedule Settings
              </h2>

              <p>
                Configure your timetable
              </p>
            </div>
          </div>

          <ScheduleSettings
            roomsAvailable={
              roomsAvailable
            }
            setRoomsAvailable={
              setRoomsAvailable
            }
            days={days}
            setDays={setDays}
            slots={slots}
            setSlots={setSlots}
          />

          <div className="generate-area">
            <button
              className="generate-button"
              onClick={
                handleGenerateTimetable
              }
              disabled={loading}
            >
              <span>
                {loading
                  ? "⏳ Generating..."
                  : "✨ Generate Timetable & PDF"}
              </span>
            </button>
          </div>
        </section>

        {/* Email */}

        <section className="dashboard-section">
          <div className="section-heading">
            <span className="section-icon">
              📧
            </span>

            <div>
              <h2>
                Email Full Timetable
              </h2>

              <p>
                Send the generated
                timetable directly
              </p>
            </div>
          </div>

          <EmailTimetable
            email={email}
            setEmail={setEmail}
            onSend={
              handleSendTimetableEmail
            }
            loading={loading}
          />
        </section>

        {/* Professors */}

        <section className="dashboard-section professor-section">
          <div className="section-heading">
            <span className="section-icon">
              👨‍🏫
            </span>

            <div>
              <h2>
                Notify Professors
              </h2>

              <p>
                Send individual schedules
                to professors
              </p>
            </div>
          </div>

          <ProfessorNotifications
            professors={professors}
            selectedProfessors={
              selectedProfessors
            }
            sendingProfEmails={
              sendingProfEmails
            }
            profDirectoryStatus={
              profDirectoryStatus
            }
            onFileUpload={
              handleProfessorFileUpload
            }
            onToggleProfessor={
              toggleProfessorSelection
            }
            onSend={
              handleSendProfessorEmails
            }
          />
        </section>

        {/* Timetable */}

        <Timetable
          timetable={timetable}
        />
      </main>

      {/* Footer */}

      <footer className="app-footer">
        <span>
          Timetable Scheduler
        </span>

        <span>
          •
        </span>

        <span>
          Smart Academic Planning
        </span>
      </footer>
    </div>
  );
}

export default App;
