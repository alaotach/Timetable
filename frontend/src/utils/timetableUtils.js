/* =========================================================
   TIME HELPERS
========================================================= */

const parseTimeToMinutes = (timeString) => {
  if (!timeString) return null;

  const value = String(timeString)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const match = value.match(
    /^(\d{1,2})(?::(\d{2}))?(AM|PM)?$/
  );

  if (!match) return null;

  let hour = Number(match[1]);

  const minute = Number(
    match[2] || 0
  );

  const period = match[3];

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  return hour * 60 + minute;
};


/* =========================================================
   CHECK CONSECUTIVE SLOTS
========================================================= */

const areConsecutiveSlots = (
  firstSlot,
  secondSlot
) => {
  const firstTime =
    parseTimeToMinutes(firstSlot);

  const secondTime =
    parseTimeToMinutes(secondSlot);

  if (
    firstTime === null ||
    secondTime === null
  ) {
    return false;
  }

  return (
    secondTime - firstTime === 60
  );
};


/* =========================================================
   SHUFFLE
========================================================= */

const shuffle = (array) => {
  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ];
  }

  return result;
};


/* =========================================================
   PROFESSOR SCHEDULE
========================================================= */

export const extractAndFormatProfSchedule = (
  fullTimetable,
  profName
) => {
  const normProfName =
    String(profName || "")
      .trim()
      .toLowerCase();

  const scheduleByDay = {};

  Object.entries(
    fullTimetable || {}
  ).forEach(
    ([batch, daysData]) => {
      Object.entries(
        daysData || {}
      ).forEach(
        ([day, slotsData]) => {
          Object.entries(
            slotsData || {}
          ).forEach(
            ([slot, entries]) => {

              if (!Array.isArray(entries)) {
                return;
              }

              entries.forEach(
                (entry) => {

                  if (
                    !String(entry).includes(
                      " - "
                    )
                  ) {
                    return;
                  }

                  const parts =
                    String(entry).split(
                      " - "
                    );

                  const profPart =
                    parts
                      .pop()
                      .trim()
                      .toLowerCase();

                  const coursePart =
                    parts
                      .join(" - ")
                      .trim();

                  if (
                    profPart ===
                      normProfName ||
                    profPart.includes(
                      normProfName
                    ) ||
                    normProfName.includes(
                      profPart
                    )
                  ) {

                    if (
                      !scheduleByDay[day]
                    ) {
                      scheduleByDay[day] =
                        {};
                    }

                    if (
                      !scheduleByDay[day][slot]
                    ) {
                      scheduleByDay[day][slot] =
                        [];
                    }

                    scheduleByDay[day][
                      slot
                    ].push(
                      `${coursePart} (${batch})`
                    );
                  }
                }
              );
            }
          );
        }
      );
    }
  );

  let formattedText =
    `Individual Class Schedule for Prof. ${profName}\n`;

  formattedText +=
    "=".repeat(45) + "\n\n";

  const daysFound =
    Object.keys(scheduleByDay);

  if (daysFound.length === 0) {
    formattedText +=
      "No classes scheduled for this week.";

    return formattedText;
  }

  daysFound.forEach((day) => {

    formattedText +=
      `📅 ${day}:\n`;

    Object.entries(
      scheduleByDay[day]
    ).forEach(
      ([slot, classes]) => {

        formattedText +=
          `   • ${slot}: ${classes.join(
            ", "
          )}\n`;
      }
    );

    formattedText += "\n";
  });

  return formattedText;
};


/* =========================================================
   FORMAT TIMETABLE FOR EMAIL
========================================================= */

export const formatTimetableText = (
  generatedTimetable
) => {
  let text = "Timetable\n\n";

  Object.keys(
    generatedTimetable || {}
  ).forEach((batch) => {

    const batchData =
      generatedTimetable[batch];

    text +=
      `Batch: ${batch}\n` +
      "-".repeat(40) +
      "\n";

    Object.keys(
      batchData || {}
    ).forEach((day) => {

      text += `${day}:\n`;

      Object.keys(
        batchData[day] || {}
      ).forEach((slot) => {

        const classes =
          batchData[day][slot];

        if (
          Array.isArray(classes) &&
          classes.length > 0
        ) {
          text +=
            `  ${slot} - ${classes.join(
              ", "
            )}\n`;
        }
      });
    });

    text += "\n";
  });

  return text;
};


/* =========================================================
   CREATE EMPTY TIMETABLE
========================================================= */

const createEmptyTimetable = (
  courses,
  days,
  slots
) => {

  const timetable = {};

  courses.forEach((course) => {

    const batch = course.batch;

    if (!timetable[batch]) {
      timetable[batch] = {};
    }

    days.forEach((day) => {

      if (!timetable[batch][day]) {
        timetable[batch][day] = {};
      }

      slots.forEach((slot) => {

        timetable[batch][day][slot] =
          [];
      });
    });
  });

  return timetable;
};


/* =========================================================
   CREATE OCCUPANCY MAPS
========================================================= */

const createOccupancyMaps = (
  days,
  slots
) => {

  const batchOccupied = {};
  const professorOccupied = {};
  const roomOccupied = {};

  days.forEach((day) => {

    batchOccupied[day] = {};
    professorOccupied[day] = {};
    roomOccupied[day] = {};

    slots.forEach((slot) => {

      batchOccupied[day][slot] =
        new Set();

      professorOccupied[day][slot] =
        new Set();

      roomOccupied[day][slot] = 0;
    });
  });

  return {
    batchOccupied,
    professorOccupied,
    roomOccupied,
  };
};


/* =========================================================
   COURSE DAILY HOURS
========================================================= */

const createCourseDailyHours = (
  courses,
  days
) => {

  const result = {};

  courses.forEach((course) => {

    const courseKey =
      course._id;

    result[courseKey] = {};

    days.forEach((day) => {
      result[courseKey][day] = 0;
    });
  });

  return result;
};


/* =========================================================
   GENERATE ALL 2-HOUR BLOCKS
========================================================= */

const getTwoHourBlocks = (
  slots
) => {

  const blocks = [];

  for (
    let i = 0;
    i < slots.length - 1;
    i++
  ) {

    const first =
      slots[i];

    const second =
      slots[i + 1];

    if (
      areConsecutiveSlots(
        first,
        second
      )
    ) {
      blocks.push([
        first,
        second,
      ]);
    }
  }

  return blocks;
};


/* =========================================================
   GET POSSIBLE PLACEMENTS
========================================================= */

const getPossiblePlacements = ({
  course,
  sessionHours,
  days,
  slots,
  twoHourBlocks,
  courseDailyHours,
  batchOccupied,
  professorOccupied,
  roomOccupied,
  roomsAvailable,
}) => {

  const placements = [];

  const courseKey =
    course._id;

  for (const day of days) {

    const alreadyToday =
      courseDailyHours[
        courseKey
      ][day];

    /*
     * Maximum 2 hours per course per day.
     */

    if (
      alreadyToday +
        sessionHours >
      2
    ) {
      continue;
    }


    /* =====================================================
       TWO-HOUR SESSION
    ===================================================== */

    if (sessionHours === 2) {

      for (
        const block of twoHourBlocks
      ) {

        let possible = true;

        for (
          const slot of block
        ) {

          /*
           * Batch conflict
           */

          if (
            batchOccupied[day][
              slot
            ].has(course.batch)
          ) {
            possible = false;
            break;
          }

          /*
           * Professor conflict
           */

          if (
            course.prof &&
            professorOccupied[day][
              slot
            ].has(course.prof)
          ) {
            possible = false;
            break;
          }

          /*
           * Room conflict
           */

          if (
            roomOccupied[day][slot] >=
            roomsAvailable
          ) {
            possible = false;
            break;
          }
        }

        if (possible) {

          placements.push({
            day,
            slots: block,
          });
        }
      }

      continue;
    }


    /* =====================================================
       ONE-HOUR SESSION
    ===================================================== */

    if (sessionHours === 1) {

      for (
        const slot of slots
      ) {

        /*
         * Batch conflict
         */

        if (
          batchOccupied[day][slot].has(
            course.batch
          )
        ) {
          continue;
        }

        /*
         * Professor conflict
         */

        if (
          course.prof &&
          professorOccupied[day][
            slot
          ].has(course.prof)
        ) {
          continue;
        }

        /*
         * Room conflict
         */

        if (
          roomOccupied[day][slot] >=
          roomsAvailable
        ) {
          continue;
        }

        placements.push({
          day,
          slots: [slot],
        });
      }
    }
  }

  return shuffle(placements);
};


/* =========================================================
   PLACE SESSION
========================================================= */

const placeSession = ({
  timetable,
  course,
  placement,
  courseDailyHours,
  batchOccupied,
  professorOccupied,
  roomOccupied,
}) => {

  const {
    day,
    slots,
  } = placement;

  const courseKey =
    course._id;

  const classText =
    `${course.course} - ${
      course.prof || "TBA"
    }`;

  slots.forEach((slot) => {

    /*
     * Add class to timetable
     */

    timetable[
      course.batch
    ][day][slot].push(
      classText
    );

    /*
     * Batch occupancy
     */

    batchOccupied[day][slot].add(
      course.batch
    );

    /*
     * Professor occupancy
     */

    if (course.prof) {
      professorOccupied[day][slot].add(
        course.prof
      );
    }

    /*
     * Room occupancy
     */

    roomOccupied[day][slot]++;

    /*
     * Course daily hours
     */

    courseDailyHours[
      courseKey
    ][day]++;
  });
};


/* =========================================================
   REMOVE SESSION
========================================================= */

const removeSession = ({
  timetable,
  course,
  placement,
  courseDailyHours,
  batchOccupied,
  professorOccupied,
  roomOccupied,
}) => {

  const {
    day,
    slots,
  } = placement;

  const courseKey =
    course._id;

  const classText =
    `${course.course} - ${
      course.prof || "TBA"
    }`;

  slots.forEach((slot) => {

    /*
     * Remove class from timetable
     */

    const classes =
      timetable[
        course.batch
      ][day][slot];

    const index =
      classes.lastIndexOf(
        classText
      );

    if (index !== -1) {
      classes.splice(index, 1);
    }

    /*
     * Batch
     */

    batchOccupied[day][
      slot
    ].delete(course.batch);

    /*
     * Professor
     */

    if (course.prof) {
      professorOccupied[day][
        slot
      ].delete(course.prof);
    }

    /*
     * Room
     */

    roomOccupied[day][slot]--;

    /*
     * Daily course hours
     */

    courseDailyHours[
      courseKey
    ][day]--;
  });
};


/* =========================================================
   CREATE SESSION PLAN
========================================================= */

/*
 * Credit 4:
 *
 * 2 + 2
 *
 * Credit 3:
 *
 * 2 + 1
 *
 * Credit 2:
 *
 * 2
 *
 * Credit 1:
 *
 * 1
 *
 * This means whenever possible,
 * the scheduler creates continuous
 * 2-hour sessions.
 */

const createSessionPlan = (
  credit
) => {

  const sessions = [];

  let remaining = credit;

  while (remaining >= 2) {

    sessions.push(2);

    remaining -= 2;
  }

  if (remaining === 1) {
    sessions.push(1);
  }

  return sessions;
};


/* =========================================================
   BACKTRACKING SCHEDULER
========================================================= */

const scheduleCourses = ({
  courseIndex,
  courses,
  sessionsByCourse,
  timetable,
  days,
  slots,
  twoHourBlocks,
  roomsAvailable,
  courseDailyHours,
  batchOccupied,
  professorOccupied,
  roomOccupied,
}) => {

  /*
   * ALL COURSES SUCCESSFULLY SCHEDULED
   */

  if (
    courseIndex >=
    courses.length
  ) {
    return true;
  }


  const course =
    courses[courseIndex];

  const sessions =
    sessionsByCourse[
      course._id
    ];


  /*
   * Schedule this course's sessions
   * one by one.
   */

  const scheduleSession = (
    sessionIndex
  ) => {

    /*
     * All sessions for this course
     * are complete.
     */

    if (
      sessionIndex >=
      sessions.length
    ) {

      /*
       * Move to next course.
       */

      return scheduleCourses({
        courseIndex:
          courseIndex + 1,

        courses,

        sessionsByCourse,

        timetable,

        days,

        slots,

        twoHourBlocks,

        roomsAvailable,

        courseDailyHours,

        batchOccupied,

        professorOccupied,

        roomOccupied,
      });
    }


    const sessionHours =
      sessions[sessionIndex];


    /*
     * Find all possible positions.
     */

    const placements =
      getPossiblePlacements({
        course,

        sessionHours,

        days,

        slots,

        twoHourBlocks,

        courseDailyHours,

        batchOccupied,

        professorOccupied,

        roomOccupied,

        roomsAvailable,
      });


    /*
     * Try every possible placement.
     *
     * THIS is the important difference
     * from the previous algorithm.
     */

    for (
      const placement of placements
    ) {

      /*
       * Place it.
       */

      placeSession({
        timetable,

        course,

        placement,

        courseDailyHours,

        batchOccupied,

        professorOccupied,

        roomOccupied,
      });


      /*
       * Try continuing.
       */

      const success =
        scheduleSession(
          sessionIndex + 1
        );


      /*
       * SUCCESS
       */

      if (success) {
        return true;
      }


      /*
       * FAILURE
       *
       * Undo the placement and try
       * another possible position.
       */

      removeSession({
        timetable,

        course,

        placement,

        courseDailyHours,

        batchOccupied,

        professorOccupied,

        roomOccupied,
      });
    }


    /*
     * No placement worked.
     */

    return false;
  };


  return scheduleSession(0);
};


/* =========================================================
   FINAL VALIDATION
========================================================= */

const validateTimetable = ({
  timetable,
  courses,
  days,
  slots,
}) => {

  for (
    const course of courses
  ) {

    let totalHours = 0;

    const dailyHours = {};

    days.forEach((day) => {
      dailyHours[day] = 0;
    });


    /*
     * Find this course's classes.
     */

    days.forEach((day) => {

      const batchDay =
        timetable[
          course.batch
        ]?.[day];

      if (!batchDay) {
        return;
      }

      slots.forEach((slot) => {

        const classes =
          batchDay[slot] || [];

        const found =
          classes.some(
            (entry) => {

              const parts =
                String(entry).split(
                  " - "
                );

              const courseName =
                parts[0]?.trim();

              const professor =
                parts
                  .slice(1)
                  .join(" - ")
                  .trim();

              return (
                courseName ===
                  course.course &&
                (
                  !course.prof ||
                  professor ===
                    course.prof
                )
              );
            }
          );

        if (found) {

          totalHours++;

          dailyHours[day]++;
        }
      });
    });


    /*
     * EXACT CREDIT HOURS
     */

    if (
      totalHours !==
      course.credit
    ) {

      throw new Error(
        `Validation failed for "${course.course}": expected ${course.credit} hours, found ${totalHours}.`
      );
    }


    /*
     * MAXIMUM 2 HOURS PER DAY
     */

    for (
      const day of days
    ) {

      if (
        dailyHours[day] > 2
      ) {

        throw new Error(
          `Validation failed for "${course.course}": more than 2 hours on ${day}.`
        );
      }
    }


    /*
     * TWO HOURS MUST BE CONTINUOUS
     */

    for (
      const day of days
    ) {

      if (
        dailyHours[day] !== 2
      ) {
        continue;
      }

      const matchingSlots =
        slots.filter((slot) => {

          const classes =
            timetable[
              course.batch
            ]?.[day]?.[slot] ||
            [];

          return classes.some(
            (entry) => {

              const parts =
                String(entry).split(
                  " - "
                );

              const courseName =
                parts[0]?.trim();

              const professor =
                parts
                  .slice(1)
                  .join(" - ")
                  .trim();

              return (
                courseName ===
                  course.course &&
                (
                  !course.prof ||
                  professor ===
                    course.prof
                )
              );
            }
          );
        });


      if (
        matchingSlots.length !==
          2 ||
        !areConsecutiveSlots(
          matchingSlots[0],
          matchingSlots[1]
        )
      ) {

        throw new Error(
          `Validation failed for "${course.course}" on ${day}: the 2 hours are not consecutive.`
        );
      }
    }
  }
};


/* =========================================================
   MAIN GENERATOR
========================================================= */

export const generateTimetableData = ({
  courseLoads,
  days,
  slots,
  roomsAvailable,
}) => {

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (
    !Array.isArray(courseLoads) ||
    courseLoads.length === 0
  ) {
    throw new Error(
      "Please add at least one course."
    );
  }

  if (
    !Array.isArray(days) ||
    days.length === 0
  ) {
    throw new Error(
      "Please provide working days."
    );
  }

  if (
    !Array.isArray(slots) ||
    slots.length === 0
  ) {
    throw new Error(
      "Please provide time slots."
    );
  }

  if (
    !roomsAvailable ||
    Number(roomsAvailable) < 1
  ) {
    throw new Error(
      "Rooms available must be at least 1."
    );
  }


  /* =======================================================
     CLEAN COURSES
  ======================================================= */

  const validCourses =
    courseLoads
      .filter(
        (course) =>
          course?.batch &&
          course?.course
      )
      .map(
        (course, index) => ({
          _id:
            `${course.batch}-${course.course}-${index}`,

          batch:
            String(course.batch).trim(),

          course:
            String(course.course).trim(),

          prof:
            String(course.prof || "").trim(),

          credit: Math.max(
            1,
            Number(course.credit) || 1
          ),
        })
      );


  if (
    validCourses.length === 0
  ) {
    throw new Error(
      "Please enter valid course information."
    );
  }


  /* =======================================================
     MAX POSSIBLE HOURS
  ======================================================= */

  const maximumWeeklyHours =
    days.length * 2;

  for (
    const course of validCourses
  ) {

    if (
      course.credit >
      maximumWeeklyHours
    ) {

      throw new Error(
        `"${course.course}" has ${course.credit} credits, but with a maximum of 2 hours/day and ${days.length} working days, it can have at most ${maximumWeeklyHours} hours/week.`
      );
    }
  }


  /* =======================================================
     CREATE TIMETABLE
  ======================================================= */

  const timetable =
    createEmptyTimetable(
      validCourses,
      days,
      slots
    );


  /* =======================================================
     OCCUPANCY
  ======================================================= */

  const {
    batchOccupied,
    professorOccupied,
    roomOccupied,
  } = createOccupancyMaps(
    days,
    slots
  );


  /* =======================================================
     COURSE DAILY HOURS
  ======================================================= */

  const courseDailyHours =
    createCourseDailyHours(
      validCourses,
      days
    );


  /* =======================================================
     TWO-HOUR BLOCKS
  ======================================================= */

  const twoHourBlocks =
    getTwoHourBlocks(slots);


  if (
    twoHourBlocks.length === 0
  ) {

    const hasTwoCreditCourse =
      validCourses.some(
        (course) =>
          course.credit >= 2
      );

    if (hasTwoCreditCourse) {

      throw new Error(
        "There are no consecutive 1-hour slots available. Please configure slots such as 9AM,10AM,11AM,1PM,2PM."
      );
    }
  }


  /* =======================================================
     SESSION PLANS
  ======================================================= */

  const sessionsByCourse = {};

  validCourses.forEach(
    (course) => {

      sessionsByCourse[
        course._id
      ] =
        createSessionPlan(
          course.credit
        );
    }
  );


  /* =======================================================
     SMART COURSE ORDER
  ======================================================= */

  /*
   * Hardest courses first.
   *
   * Priority:
   *
   * 1. Higher credits
   * 2. Professors
   * 3. Same batch
   */

  const coursesToSchedule =
    [...validCourses].sort(
      (a, b) => {

        if (
          b.credit !==
          a.credit
        ) {
          return (
            b.credit -
            a.credit
          );
        }

        if (
          Boolean(b.prof) !==
          Boolean(a.prof)
        ) {
          return b.prof
            ? -1
            : 1;
        }

        return 0;
      }
    );


  /* =======================================================
     BACKTRACKING
  ======================================================= */

  const success =
    scheduleCourses({
      courseIndex: 0,

      courses:
        coursesToSchedule,

      sessionsByCourse,

      timetable,

      days,

      slots,

      twoHourBlocks,

      roomsAvailable:

        Number(
          roomsAvailable
        ),

      courseDailyHours,

      batchOccupied,

      professorOccupied,

      roomOccupied,
    });


  /* =======================================================
     NO SOLUTION
  ======================================================= */

  if (!success) {

    throw new Error(
      "No valid timetable could be found with the current courses, credits, days, time slots, professors and room capacity. Try adding more time slots/rooms or reducing conflicting courses."
    );
  }


  /* =======================================================
     FINAL VALIDATION
  ======================================================= */

  validateTimetable({
    timetable,

    courses:
      validCourses,

    days,

    slots,
  });


  console.log(
    "✅ Timetable generated successfully."
  );

  console.log(
    "Course hours:"
  );

  validCourses.forEach(
    (course) => {

      console.log(
        `${course.course}: ${course.credit} hour(s)/week`
      );
    }
  );


  return timetable;
};