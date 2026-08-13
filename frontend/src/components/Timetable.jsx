import React from "react";

function Timetable({ timetable = null }) {
  // No timetable generated yet
  if (!timetable) {
    return (
      <section className="timetable-empty">
        <div className="empty-icon">
          📅
        </div>

        <h3>
          Your timetable will appear here
        </h3>

        <p>
          Configure your courses and schedule
          settings, then generate the timetable.
        </p>
      </section>
    );
  }

  const batches = Object.keys(timetable);

  // Timetable exists but contains no batches
  if (batches.length === 0) {
    return (
      <section className="timetable-empty">
        <div className="empty-icon">
          📅
        </div>

        <h3>
          No timetable entries found
        </h3>

        <p>
          Add courses and generate the timetable
          again.
        </p>
      </section>
    );
  }

  return (
    <section className="timetable-section">

      {/* =====================================================
          SECTION HEADER
      ===================================================== */}

      <div className="section-heading timetable-heading">

        <span className="section-icon">
          📊
        </span>

        <div>
          <h2>
            Generated Timetable
          </h2>

          <p>
            Your weekly academic schedule
          </p>
        </div>

      </div>


      {/* =====================================================
          TIMETABLE LIST
      ===================================================== */}

      <div className="timetable-list">

        {batches.map((batch) => {
          const batchData =
            timetable[batch] || {};

          const batchDays =
            Object.keys(batchData);

          if (batchDays.length === 0) {
            return null;
          }

          /*
           * Get slots from the first available day.
           */
          const firstDay =
            batchDays[0];

          const batchSlots = Object.keys(
            batchData[firstDay] || {}
          );

          return (
            <div
              className="timetable-card"
              key={batch}
            >

              {/* =================================================
                  CARD HEADER
              ================================================= */}

              <div className="timetable-card-header">

                <div>
                  <span>
                    WEEKLY SCHEDULE
                  </span>

                  <h3>
                    Batch {batch}
                  </h3>
                </div>

                <div className="batch-badge">
                  {batchDays.length} Days
                </div>

              </div>


              {/* =================================================
                  TABLE
              ================================================= */}

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>

                      <th>
                        Day
                      </th>

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
                      (day) => {

                        const dayData =
                          batchData[day] || {};

                        return (
                          <tr key={day}>

                            <td className="day-cell">
                              <strong>
                                {day}
                              </strong>
                            </td>

                            {batchSlots.map(
                              (slot) => {

                                const classes =
                                  Array.isArray(
                                    dayData[slot]
                                  )
                                    ? dayData[slot]
                                    : [];

                                return (
                                  <td
                                    key={slot}
                                    className={
                                      classes.length >
                                      0
                                        ? "class-cell has-class"
                                        : "class-cell"
                                    }
                                  >

                                    {classes.length >
                                    0 ? (

                                      classes.map(
                                        (
                                          classItem,
                                          index
                                        ) => (

                                          <div
                                            className="class-entry"
                                            key={
                                              index
                                            }
                                          >
                                            {
                                              classItem
                                            }
                                          </div>

                                        )
                                      )

                                    ) : (

                                      <span className="empty-slot">
                                        —
                                      </span>

                                    )}

                                  </td>
                                );
                              }
                            )}

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}

export default Timetable;