"""
Email Sender Agent
-------------------
Sends one email per professor via the EmailJS REST API (the same
EmailJS account already wired up on the frontend), looping server-side
so we can notify many professors from one request.

Env vars required (put these in backend/.env):
    EMAILJS_SERVICE_ID
    EMAILJS_TEMPLATE_ID   - a template with variables:
                             {{to_email}}, {{prof_name}}, {{schedule_text}}
    EMAILJS_PUBLIC_KEY
    EMAILJS_PRIVATE_KEY   - required for server-side (non-browser) calls.
                             Generate it in the EmailJS dashboard under
                             Account > API Keys, and turn on "Allow API
                             calls from non-browser applications" under
                             Account > Security - EmailJS blocks server
                             calls by default.
"""
import os
from typing import Dict, List

import requests


EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send"


def get_emailjs_config():
    service_id = os.getenv("EMAILJS_SERVICE_ID")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID")
    public_key = os.getenv("EMAILJS_PUBLIC_KEY")

    missing = []

    if not service_id:
        missing.append("EMAILJS_SERVICE_ID")
    if not template_id:
        missing.append("EMAILJS_TEMPLATE_ID")
    if not public_key:
        missing.append("EMAILJS_PUBLIC_KEY")

    if missing:
        raise RuntimeError(
            "Missing EmailJS environment variables: "
            + ", ".join(missing)
        )

    return service_id, template_id, public_key


def send_professor_email(
    to_email: str,
    prof_name: str,
    schedule_text: str
) -> Dict:

    service_id, template_id, public_key= get_emailjs_config()

    body = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,
        "template_params": {
            "to_email": to_email,
            "prof_name": prof_name,
            "schedule_text": schedule_text,
        },
    }

    print("\n========== EMAIL DEBUG ==========")
    print("Professor:", prof_name)
    print("Email:", to_email)
    print("Service ID:", service_id)
    print("Template ID:", template_id)
    print("Public key exists:", bool(public_key))
    print("Schedule:")
    print(schedule_text)
    print("=================================\n")

    response = requests.post(
        EMAILJS_ENDPOINT,
        json=body,
        timeout=15
    )

    print("EmailJS status:", response.status_code)
    print("EmailJS response:", response.text)

    if response.status_code != 200:
        raise RuntimeError(
            f"EmailJS send failed for {to_email}: "
            f"{response.status_code} {response.text}"
        )

    return {
        "to": to_email,
        "status": "sent"
    }


def send_bulk(professor_payloads: List[Dict]) -> Dict[str, List[Dict]]:

    sent = []
    failed = []

    for p in professor_payloads:

        try:
            result = send_professor_email(
                p["email"],
                p["name"],
                p["schedule_text"]
            )

            sent.append(result)

        except Exception as exc:

            failed.append({
                "name": p.get("name"),
                "email": p.get("email"),
                "error": str(exc),
            })

    return {
        "sent": sent,
        "failed": failed,
    }