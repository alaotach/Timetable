import React from "react";

function CourseLoads({
  courseLoads = [],
  onCourseChange,
  onAddCourse,
}) {
  const courses = Array.isArray(courseLoads)
    ? courseLoads
    : [];

  return (
    <div className="course-container">

      {/* =====================================================
          COURSE LIST
      ===================================================== */}

      <div className="course-list">

        {courses.length === 0 ? (
          <div className="empty-course-state">

            <div className="empty-course-icon">
              📚
            </div>

            <h3>
              No courses added
            </h3>

            <p>
              Add your first course to start
              building the timetable.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={onAddCourse}
            >
              ＋ Add First Course
            </button>

          </div>
        ) : (
          courses.map((course, index) => {

            // Safety fallback in case a course
            // object is incomplete.
            const currentCourse = course || {};

            return (
              <div
                className="course-card"
                key={index}
              >

                {/* =========================================
                    COURSE NUMBER
                ========================================= */}

                <div className="course-number">
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </div>


                {/* =========================================
                    COURSE FIELDS
                ========================================= */}

                <div className="course-fields">

                  {/* Batch */}

                  <div className="input-group">

                    <label htmlFor={`batch-${index}`}>
                      Batch
                    </label>

                    <input
                      id={`batch-${index}`}
                      type="text"
                      placeholder="e.g. CSE-2024"
                      value={
                        currentCourse.batch ?? ""
                      }
                      onChange={(event) =>
                        onCourseChange(
                          index,
                          "batch",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  {/* Course */}

                  <div className="input-group">

                    <label htmlFor={`course-${index}`}>
                      Course
                    </label>

                    <input
                      id={`course-${index}`}
                      type="text"
                      placeholder="e.g. Machine Learning"
                      value={
                        currentCourse.course ?? ""
                      }
                      onChange={(event) =>
                        onCourseChange(
                          index,
                          "course",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  {/* Professor */}

                  <div className="input-group">

                    <label htmlFor={`prof-${index}`}>
                      Professor
                    </label>

                    <input
                      id={`prof-${index}`}
                      type="text"
                      placeholder="e.g. Dr. Sharma"
                      value={
                        currentCourse.prof ?? ""
                      }
                      onChange={(event) =>
                        onCourseChange(
                          index,
                          "prof",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  {/* Credit */}

                  <div className="input-group credit-input">

                    <label htmlFor={`credit-${index}`}>
                      Credit
                    </label>

                    <input
                      id={`credit-${index}`}
                      type="number"
                      min="1"
                      max="10"
                      placeholder="Credit"
                      value={
                        currentCourse.credit ?? 0
                      }
                      onChange={(event) =>
                        onCourseChange(
                          index,
                          "credit",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>


      {/* =====================================================
          ADD COURSE BUTTON
      ===================================================== */}

      {courses.length > 0 && (
        <div className="course-actions">

          <button
            type="button"
            className="secondary-button add-course-button"
            onClick={onAddCourse}
          >
            <span className="add-course-icon">
              ＋
            </span>

            <span>
              Add Course
            </span>
          </button>

          <span className="course-count">
            {courses.length}{" "}
            {courses.length === 1
              ? "course"
              : "courses"}{" "}
            added
          </span>

        </div>
      )}

    </div>
  );
}

export default CourseLoads;