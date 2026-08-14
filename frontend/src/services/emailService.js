import emailjs from "@emailjs/browser";

const SERVICE_ID =
  import.meta.env.VITE_SERVICE_ID;

const TEMPLATE_ID =
  import.meta.env.VITE_TEMPLATE_ID;

const PUBLIC_KEY =
  import.meta.env.VITE_PUBLIC_KEY;


/* =========================================================
   CONFIGURATION CHECK
========================================================= */

const checkEmailJSConfig = () => {
  if (!SERVICE_ID) {
    throw new Error(
      "EmailJS Service ID is missing. Check VITE_SERVICE_ID in .env"
    );
  }

  if (!TEMPLATE_ID) {
    throw new Error(
      "EmailJS Template ID is missing. Check VITE_TEMPLATE_ID in .env"
    );
  }

  if (!PUBLIC_KEY) {
    throw new Error(
      "EmailJS Public Key is missing. Check VITE_PUBLIC_KEY in .env"
    );
  }
};


/* =========================================================
   SEND FULL TIMETABLE
========================================================= */

export const sendFullTimetableEmail =
  async (
    email,
    timetableText
  ) => {

    checkEmailJSConfig();

    return emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        name: "Timetable Scheduler",
        email: email,
        timetable_text: timetableText,
      },
      {
        publicKey: PUBLIC_KEY,
      }
    );
  };


/* =========================================================
   SEND PROFESSOR TIMETABLE
========================================================= */

export const sendProfessorTimetableEmail =
  async (
    email,
    professorName,
    scheduleText
  ) => {

    checkEmailJSConfig();

    return emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        prof_name: professorName,
        timetable_text: scheduleText,
      },
      {
        publicKey: PUBLIC_KEY,
      }
    );
  };
