import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import emailjs from "@emailjs/browser";
const SERVICE_ID = "service_nrbsu7h";
const TEMPLATE_ID = "template_xxxxx";
const PUBLIC_KEY = "xxxxxxxxxxxx";

function App() {
  const [email, setEmail] = useState("");
const [pdfData, setPdfData] = useState(null);
  const [courseLoads, setCourseLoads] = useState([
    {
      batch: "",
      course: "",
      prof: "",
      credit: 0,
    },
  ]);

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
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Course input change
  // -----------------------------
  const handleCourseChange = (index, field, value) => {
    const updated = [...courseLoads];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setCourseLoads(updated);
  };

  // -----------------------------
  // Add course row
  // -----------------------------
  const addCourseRow = () => {
    setCourseLoads([
      ...courseLoads,
      {
        batch: "",
        course: "",
        prof: "",
        credit: 0,
      },
    ]);
  };

  // -----------------------------
  // Generate PDF
  // -----------------------------
  const generatePDF = (generatedTimetable) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(20);

    doc.text("Weekly Timetable", 148, 15, {
      align: "center",
    });

    doc.setFontSize(10);

    doc.text(
      `Rooms Available: ${roomsAvailable}`,
      14,
      23
    );

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

      if (batchDays.length === 0) {
        return;
      }

      const firstDay = batchDays[0];

      const batchSlots = Object.keys(
        batchData[firstDay] || {}
      );

      const headers = ["Day", ...batchSlots];

      const body = batchDays.map((day) => {
        const row = [day];

        batchSlots.forEach((slot) => {
          const classes =
            batchData[day]?.[slot] || [];

          row.push(
            classes.length > 0
              ? classes.join(", ")
              : "-"
          );
        });

        return row;
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [headers],
        body: body,
        theme: "grid",

        styles: {
          fontSize: 8,
          cellPadding: 3,
          halign: "center",
          valign: "middle",
        },

        headStyles: {
          fontSize: 9,
          fontStyle: "bold",
        },

        columnStyles: {
          0: {
            fontStyle: "bold",
          },
        },

        margin: {
          left: 14,
          right: 14,
        },
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save("weekly-timetable.pdf");
    return doc;
  };

const sendTimetableEmail = async () => {
  if (!email) {
    alert("Email address enter karo.");
    return;
  }

  if (!timetable) {
    alert("Pehle timetable generate karo.");
    return;
  }

  try {
    setLoading(true);

    // PDF banao, lekin download mat karo
    const doc = generatePDF(timetable, false);

    // PDF ko Data URI/Base64 mein convert karo
    const pdfBase64 = doc.output("datauristring");

    console.log("SERVICE:", SERVICE_ID);
    console.log("TEMPLATE:", TEMPLATE_ID);
    console.log("EMAIL:", email);
    console.log("PDF SIZE:", pdfBase64.length);

    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        message: "Please find the weekly timetable attached.",
        pdf_attachment: pdfBase64,
      },
      {
        publicKey: PUBLIC_KEY,
      }
    );

    console.log("EMAIL SUCCESS:", result);

    alert("✅ Email successfully sent!");

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    console.error("STATUS:", error?.status);
    console.error("TEXT:", error?.text);

    alert(
      `❌ Email failed\n\n${
        error?.text || error?.message || "Unknown EmailJS error"
      }`
    );
  } finally {
    setLoading(false);
  }
};

  // -----------------------------
  // FRONTEND-ONLY TIMETABLE
  // -----------------------------
  const generateTimetable = () => {
    try {
      setLoading(true);

      const generatedTimetable = {};

      // --------------------------------
      // Create timetable for every batch
      // --------------------------------
      courseLoads.forEach((course) => {
        if (!course.batch || !course.course) {
          return;
        }

        if (!generatedTimetable[course.batch]) {
          generatedTimetable[course.batch] = {};

          days.forEach((day) => {
            generatedTimetable[course.batch][day] = {};

            slots.forEach((slot) => {
              generatedTimetable[course.batch][day][slot] =
                [];
            });
          });
        }
      });

      // --------------------------------
      // Track occupied batch/professor
      // --------------------------------
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

      // --------------------------------
      // Track rooms
      // --------------------------------
      const roomOccupied = {};

      days.forEach((day) => {
        roomOccupied[day] = {};

        slots.forEach((slot) => {
          roomOccupied[day][slot] = 0;
        });
      });

      // --------------------------------
      // Schedule courses
      // --------------------------------
      courseLoads.forEach((course) => {
        if (!course.batch || !course.course) {
          return;
        }

        const credit = Math.max(
          1,
          Number(course.credit) || 1
        );

        let classesPlaced = 0;

        for (const day of days) {
          if (classesPlaced >= credit) {
            break;
          }

          for (const slot of slots) {
            if (classesPlaced >= credit) {
              break;
            }

            // Same batch already has class
            const batchBusy =
              batchOccupied[day][slot].has(
                course.batch
              );

            // Same professor already has class
            const professorBusy =
              course.prof &&
              professorOccupied[day][slot].has(
                course.prof
              );

            // All rooms occupied
            const roomsFull =
              roomOccupied[day][slot] >=
              roomsAvailable;

            if (
              batchBusy ||
              professorBusy ||
              roomsFull
            ) {
              continue;
            }

            // Add class
            generatedTimetable[course.batch][day][
              slot
            ].push(
              `${course.course} - ${
                course.prof || "TBA"
              }`
            );

            // Mark batch occupied
            batchOccupied[day][slot].add(
              course.batch
            );

            // Mark professor occupied
            if (course.prof) {
              professorOccupied[day][slot].add(
                course.prof
              );
            }

            // Mark room occupied
            roomOccupied[day][slot]++;

            classesPlaced++;
          }
        }

        // Warning if all credits could not be scheduled
        if (classesPlaced < credit) {
          console.warn(
            `Could not schedule all classes for ${course.course}.`
          );
        }
      });

      // --------------------------------
      // Show timetable
      // --------------------------------
      setTimetable(generatedTimetable);

      // --------------------------------
      // Generate PDF
      // --------------------------------
      generatePDF(generatedTimetable);

      alert(
        "Timetable generated successfully!\nPDF downloaded."
      );
    } catch (error) {
      console.error(
        "Timetable generation error:",
        error
      );

      alert(
        "Timetable generate karte waqt error aaya."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Timetable Scheduler</h1>

      {/* -------------------------------- */}
      {/* Course Loads */}
      {/* -------------------------------- */}

      <h2>Course Loads</h2>

      {courseLoads.map((cl, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Batch"
            value={cl.batch}
            onChange={(e) =>
              handleCourseChange(
                index,
                "batch",
                e.target.value
              )
            }
          />

          <input
            type="text"
            placeholder="Course"
            value={cl.course}
            onChange={(e) =>
              handleCourseChange(
                index,
                "course",
                e.target.value
              )
            }
          />

          <input
            type="text"
            placeholder="Professor"
            value={cl.prof}
            onChange={(e) =>
              handleCourseChange(
                index,
                "prof",
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Credit"
            value={cl.credit}
            onChange={(e) =>
              handleCourseChange(
                index,
                "credit",
                Number(e.target.value)
              )
            }
          />
        </div>
      ))}

      <button onClick={addCourseRow}>
        + Add Course
      </button>

      {/* -------------------------------- */}
      {/* Rooms */}
      {/* -------------------------------- */}

      <h2>Rooms Available</h2>

      <input
        type="number"
        value={roomsAvailable}
        min="1"
        onChange={(e) =>
          setRoomsAvailable(
            Number(e.target.value)
          )
        }
      />

      {/* -------------------------------- */}
      {/* Days */}
      {/* -------------------------------- */}

      <h2>Days</h2>

      <input
        type="text"
        value={days.join(",")}
        onChange={(e) =>
          setDays(
            e.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          )
        }
      />

      <p>
        Example: Mon,Tue,Wed,Thu,Fri
      </p>

      {/* -------------------------------- */}
      {/* Slots */}
      {/* -------------------------------- */}

      <h2>Slots</h2>

      <input
        type="text"
        value={slots.join(",")}
        onChange={(e) =>
          setSlots(
            e.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          )
        }
      />

      <p>
        Example: 9AM,10AM,11AM,1PM,2PM
      </p>

      <br />

      {/* -------------------------------- */}
      {/* Generate */}
      {/* -------------------------------- */}

      <button
        onClick={generateTimetable}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading
            ? "not-allowed"
            : "pointer",
        }}
      >
        {loading
          ? "Generating..."
          : "Generate Timetable & PDF"}
      </button>
      <br/>
 

  <input
    type="email"
    placeholder="Enter email address"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={{
      padding: "10px",
      width: "280px",
      fontSize: "14px",
    }}
  />

   <button
        onClick={sendTimetableEmail}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading
            ? "not-allowed"
            : "pointer",
        }}
      >
       Send email
      </button>


      

      {/* -------------------------------- */}
      {/* Timetable Output */}
      {/* -------------------------------- */}

      {timetable &&
        Object.keys(timetable).map(
          (batch) => {
            const batchData =
              timetable[batch];

            const batchDays =
              Object.keys(batchData);

            if (batchDays.length === 0) {
              return null;
            }

            const firstDay = batchDays[0];

            const batchSlots = Object.keys(
              batchData[firstDay] || {}
            );

            return (
              <div
                className="timetable"
                key={batch}
                style={{
                  marginTop: "40px",
                }}
              >
                <h2>
                  Weekly Timetable - {batch}
                </h2>

                <table
                  border="1"
                  cellPadding="8"
                  style={{
                    borderCollapse:
                      "collapse",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr>
                      <th>Day</th>

                      {batchSlots.map(
                        (slot) => (
                          <th key={slot}>
                            {slot}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {batchDays.map(
                      (day) => (
                        <tr key={day}>
                          <td>
                            <strong>
                              {day}
                            </strong>
                          </td>

                          {batchSlots.map(
                            (slot) => {
                              const classes =
                                batchData[
                                  day
                                ]?.[
                                  slot
                                ] || [];

                              return (
                                <td
                                  key={
                                    slot
                                  }
                                >
                                  {classes.length >
                                  0
                                    ? classes.join(
                                        ", "
                                      )
                                    : "-"}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );
          }
        )}
    </div>
  );
}

export default App;