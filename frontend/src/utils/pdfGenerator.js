import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePDF = (
  generatedTimetable,
  roomsAvailable
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Title
  doc.setFontSize(20);

  doc.text(
    "Weekly Timetable",
    148,
    15,
    {
      align: "center",
    }
  );

  // Room information
  doc.setFontSize(10);

  doc.text(
    `Rooms Available: ${roomsAvailable}`,
    14,
    23
  );

  let currentY = 30;

  Object.keys(generatedTimetable).forEach(
    (batch) => {
      const batchData =
        generatedTimetable[batch];

      // Add new page if necessary
      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(15);

      doc.text(
        `Batch: ${batch}`,
        14,
        currentY
      );

      const batchDays =
        Object.keys(batchData);

      if (batchDays.length === 0) {
        return;
      }

      const firstDay =
        batchDays[0];

      const batchSlots =
        Object.keys(
          batchData[firstDay] || {}
        );

      const headers = [
        "Day",
        ...batchSlots,
      ];

      const body = batchDays.map(
        (day) => {
          const row = [day];

          batchSlots.forEach(
            (slot) => {
              const classes =
                batchData[day]?.[slot] ||
                [];

              row.push(
                classes.length > 0
                  ? classes.join(", ")
                  : "-"
              );
            }
          );

          return row;
        }
      );

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

      currentY =
        doc.lastAutoTable.finalY + 15;
    }
  );

  // Download PDF
  doc.save(
    "weekly-timetable.pdf"
  );

  return doc;
};