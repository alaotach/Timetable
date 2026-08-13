import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY;

function App() {
  const [email, setEmail] = useState("");
  const [courseLoads, setCourseLoads] = useState([
    { batch: "", course: "", prof: "", credit: 0 },
  ]);

  const [days, setDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [slots, setSlots] = useState(["9AM", "10AM", "11AM", "1PM", "2PM"]);

  const [roomsAvailable, setRoomsAvailable] = useState(3);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);

  // Professor directory state
  const [professors, setProfessors] = useState([]);
  const [selectedProfessors, setSelectedProfessors] = useState([]);
  const [sendingProfEmails, setSendingProfEmails] = useState(false);
  const [profDirectoryStatus, setProfDirectoryStatus] = useState("");

  // -------------------------------------------------------------
  // Frontend Schedule Extractor & Formatter (Replaces Backend Agent)
  // -------------------------------------------------------------
  const extractAndFormatProfSchedule = (fullTimetable, profName) => {
  // Normalize search name (e.g. "dr. sharma")
  const normProfName = profName.trim().toLowerCase();
  const scheduleByDay = {};

  Object.entries(fullTimetable).forEach(([batch, daysData]) => {
    Object.entries(daysData).forEach(([day, slotsData]) => {
      Object.entries(slotsData).forEach(([slot, entries]) => {
        entries.forEach((entry) => {
          if (!entry.includes(" - ")) return;

          // Split by " - " from right to separate course and professor
          const parts = entry.split(" - ");
          const profPart = parts.pop().trim().toLowerCase();
          const coursePart = parts.join(" - ").trim();

          // Flexible match check
          if (profPart === normProfName || profPart.includes(normProfName) || normProfName.includes(profPart)) {
            if (!scheduleByDay[day]) scheduleByDay[day] = {};
            if (!scheduleByDay[day][slot]) scheduleByDay[day][slot] = [];
            scheduleByDay[day][slot].push(`${coursePart} (${batch})`);
          }
        });
      });
    });
  });

  // Format output text
  let formattedText = `Individual Class Schedule for Prof. ${profName}\n`;
  formattedText += "=".repeat(45) + "\n\n";

  const daysFound = Object.keys(scheduleByDay);
  if (daysFound.length === 0) {
    formattedText += "No classes scheduled for this week.";
    return formattedText;
  }

  daysFound.forEach((day) => {
    formattedText += `📅 ${day}:\n`;
    Object.entries(scheduleByDay[day]).forEach(([slot, classes]) => {
      formattedText += `   • ${slot}: ${classes.join(", ")}\n`;
    });
    formattedText += "\n";
  });

  return formattedText;
};

  // -------------------------------------------------------------
  // File Processing
  // -------------------------------------------------------------
  const handleProfessorFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProfDirectoryStatus("Processing file...");
      const text = await file.text();
      let parsedProfs = [];

      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error("CSV file is empty or missing headers.");

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        parsedProfs = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          return {
            name: row.name || row.professor || row.prof_name || "Unknown",
            email: row.email || "",
            prof_id: row.prof_id || row.id || "",
          };
        });
      } else {
        const rawJson = JSON.parse(text);
        parsedProfs = rawJson.map((item) => ({
          name: item.name || item.professor || "Unknown",
          email: item.email || "",
          prof_id: String(item.prof_id || item.Prof_Id || item.id || ""),
        }));
      }

      setProfessors(parsedProfs);
      setProfDirectoryStatus(`✅ Successfully loaded ${parsedProfs.length} professor(s).`);
    } catch (error) {
      console.error("File upload error:", error);
      setProfDirectoryStatus("❌ Failed to parse file. Ensure valid CSV or JSON format.");
    } finally {
      e.target.value = "";
    }
  };

  const toggleProfessorSelection = (name) => {
    setSelectedProfessors((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // -------------------------------------------------------------
  // Direct Client-Side Bulk Email Dispatch
  // -------------------------------------------------------------
  const sendProfSpecificTimetable = async () => {
    if (!timetable) return alert("Generate the timetable first.");
    if (selectedProfessors.length === 0) return alert("Select at least one professor.");

    const targets = professors.filter((p) => selectedProfessors.includes(p.name));

    setSendingProfEmails(true);
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const target of targets) {
      if (!target.email) {
        console.warn(`Skipping ${target.name}: No email address provided.`);
        skippedCount++;
        continue;
      }

      // Extract & format prof schedule in JS
      const scheduleText = extractAndFormatProfSchedule(timetable, target.name);

      try {
        await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            to_email: target.email,
            prof_name: target.name,
            timetable_text: scheduleText,
          },
          PUBLIC_KEY
        );
        sentCount++;
      } catch (error) {
        console.error(`Failed sending to ${target.name} (${target.email}):`, error);
        failedCount++;
      }
    }

    setSendingProfEmails(false);

    if (failedCount === 0 && skippedCount === 0) {
      alert(`✅ Successfully sent individual timetables to ${sentCount} professor(s)!`);
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

  const handleCourseChange = (index, field, value) => {
    const updated = [...courseLoads];
    updated[index] = { ...updated[index], [field]: value };
    setCourseLoads(updated);
  };

  const addCourseRow = () => {
    setCourseLoads([
      ...courseLoads,
      { batch: "", course: "", prof: "", credit: 0 },
    ]);
  };

  const generatePDF = (generatedTimetable) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(20);
    doc.text("Weekly Timetable", 148, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Rooms Available: ${roomsAvailable}`, 14, 23);

    let currentY = 30;

    Object.keys(generatedTimetable).forEach((batch) => {
      const batchData = generatedTimetable[batch];

      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(15);
      doc.text(`Batch: ${batch}`, 14, currentY);

      const batchDays = Object.keys(batchData);
      if (batchDays.length === 0) return;

      const firstDay = batchDays[0];
      const batchSlots = Object.keys(batchData[firstDay] || {});
      const headers = ["Day", ...batchSlots];

      const body = batchDays.map((day) => {
        const row = [day];
        batchSlots.forEach((slot) => {
          const classes = batchData[day]?.[slot] || [];
          row.push(classes.length > 0 ? classes.join(", ") : "-");
        });
        return row;
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [headers],
        body: body,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, halign: "center", valign: "middle" },
        headStyles: { fontSize: 9, fontStyle: "bold" },
        columnStyles: { 0: { fontStyle: "bold" } },
        margin: { left: 14, right: 14 },
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save("weekly-timetable.pdf");
    return doc;
  };

  const formatTimetableText = (generatedTimetable) => {
    let text = `Timetable\n\n`;
    Object.keys(generatedTimetable).forEach((batch) => {
      const batchData = generatedTimetable[batch];
      text += `Batch: ${batch}\n` + "-".repeat(40) + "\n";

      Object.keys(batchData).forEach((day) => {
        text += `${day}:\n`;
        Object.keys(batchData[day]).forEach((slot) => {
          const classes = batchData[day][slot];
          if (classes.length > 0) {
            text += `  ${slot} - ${classes.join(", ")}\n`;
          }
        });
      });
      text += "\n";
    });
    return text;
  };

  const sendTimetableEmail = async () => {
    if (!email) return alert("Please enter email address");
    if (!timetable) return alert("Generate timetable first.");

    try {
      setLoading(true);
      const timetableText = formatTimetableText(timetable);

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          name: "Timetable Scheduler",
          email: email,
          timetable_text: timetableText,
        },
        PUBLIC_KEY
      );

      alert("✅ Timetable email successfully sent!");
    } catch (error) {
      console.error("Email Error:", error);
      alert("❌ Failed to send email. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const generateTimetable = () => {
    try {
      setLoading(true);
      const generatedTimetable = {};

      courseLoads.forEach((course) => {
        if (!course.batch || !course.course) return;

        if (!generatedTimetable[course.batch]) {
          generatedTimetable[course.batch] = {};
          days.forEach((day) => {
            generatedTimetable[course.batch][day] = {};
            slots.forEach((slot) => {
              generatedTimetable[course.batch][day][slot] = [];
            });
          });
        }
      });

      const batchOccupied = {};
      const professorOccupied = {};

      days.forEach((day) => {
        batchOccupied[day] = {};
        professorOccupied[day] = {};
        slots.forEach((slot) => {
          batchOccupied[day][slot] = new Set();
          professorOccupied[day][slot] = new Set();
        });
      });

      const roomOccupied = {};
      days.forEach((day) => {
        roomOccupied[day] = {};
        slots.forEach((slot) => {
          roomOccupied[day][slot] = 0;
        });
      });

      courseLoads.forEach((course) => {
        if (!course.batch || !course.course) return;

        const credit = Math.max(1, Number(course.credit) || 1);
        let classesPlaced = 0;

        for (const day of days) {
          if (classesPlaced >= credit) break;

          for (const slot of slots) {
            if (classesPlaced >= credit) break;

            const batchBusy = batchOccupied[day][slot].has(course.batch);
            const professorBusy =
              course.prof && professorOccupied[day][slot].has(course.prof);
            const roomsFull = roomOccupied[day][slot] >= roomsAvailable;

            if (batchBusy || professorBusy || roomsFull) continue;

            generatedTimetable[course.batch][day][slot].push(
              `${course.course} - ${course.prof || "TBA"}`
            );

            batchOccupied[day][slot].add(course.batch);
            if (course.prof) professorOccupied[day][slot].add(course.prof);
            roomOccupied[day][slot]++;
            classesPlaced++;
          }
        }
      });

      setTimetable(generatedTimetable);
      generatePDF(generatedTimetable);
      alert("Timetable generated successfully!\nPDF downloaded.");
    } catch (error) {
      console.error("Timetable generation error:", error);
      alert("Something went wrong generating the timetable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1>Timetable Scheduler</h1>

      <h2>Course Loads</h2>
      {courseLoads.map((cl, index) => (
        <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Batch"
            value={cl.batch}
            onChange={(e) => handleCourseChange(index, "batch", e.target.value)}
          />
          <input
            type="text"
            placeholder="Course"
            value={cl.course}
            onChange={(e) => handleCourseChange(index, "course", e.target.value)}
          />
          <input
            type="text"
            placeholder="Professor"
            value={cl.prof}
            onChange={(e) => handleCourseChange(index, "prof", e.target.value)}
          />
          <input
            type="number"
            placeholder="Credit"
            value={cl.credit}
            onChange={(e) => handleCourseChange(index, "credit", Number(e.target.value))}
          />
        </div>
      ))}
      <button onClick={addCourseRow}>+ Add Course</button>

      <h2>Rooms Available</h2>
      <input
        type="number"
        value={roomsAvailable}
        min="1"
        onChange={(e) => setRoomsAvailable(Number(e.target.value))}
      />

      <h2>Days</h2>
      <input
        type="text"
        value={days.join(",")}
        onChange={(e) => setDays(e.target.value.split(",").map((i) => i.trim()).filter(Boolean))}
      />

      <h2>Slots</h2>
      <input
        type="text"
        value={slots.join(",")}
        onChange={(e) => setSlots(e.target.value.split(",").map((i) => i.trim()).filter(Boolean))}
      />

      <br /><br />
      <button onClick={generateTimetable} disabled={loading}>
        {loading ? "Generating..." : "Generate Timetable & PDF"}
      </button>

      <h2>Email Full Timetable</h2>
      <input
        type="email"
        placeholder="Enter email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "8px", width: "260px" }}
      />
      <button onClick={sendTimetableEmail} disabled={loading} style={{ marginLeft: "10px" }}>
        Send Email
      </button>

      <h2>Notify Professors (Individual Schedules)</h2>
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Upload Professor JSON or CSV File:
        </label>
        <input type="file" accept=".json,.csv" onChange={handleProfessorFileUpload} />
        {profDirectoryStatus && <p>{profDirectoryStatus}</p>}
      </div>

      {professors.length === 0 ? (
        <p>No professors found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {professors.map((p, idx) => (
            <label key={p.prof_id || p.email || idx} style={{ display: "flex", gap: "8px" }}>
              <input
                type="checkbox"
                checked={selectedProfessors.includes(p.name)}
                onChange={() => toggleProfessorSelection(p.name)}
              />
              {p.name} ({p.email})
            </label>
          ))}
        </div>
      )}

      <br />
      <button onClick={sendProfSpecificTimetable} disabled={sendingProfEmails}>
        {sendingProfEmails ? "Sending..." : "Send Prof-Specific Timetables"}
      </button>

      {timetable &&
        Object.keys(timetable).map((batch) => {
          const batchData = timetable[batch];
          const batchDays = Object.keys(batchData);
          if (batchDays.length === 0) return null;

          const batchSlots = Object.keys(batchData[batchDays[0]] || {});

          return (
            <div className="timetable" key={batch} style={{ marginTop: "30px" }}>
              <h2>Timetable - {batch}</h2>
              <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", textAlign: "center" }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    {batchSlots.map((slot) => (
                      <th key={slot}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batchDays.map((day) => (
                    <tr key={day}>
                      <td><strong>{day}</strong></td>
                      {batchSlots.map((slot) => {
                        const classes = batchData[day]?.[slot] || [];
                        return <td key={slot}>{classes.length > 0 ? classes.join(", ") : "-"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
  );
}

export default App;