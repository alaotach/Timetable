"""
Timetable Extractor Agent
--------------------------
Takes the full generated timetable and pulls out ONE professor's
personal schedule from it, then formats it as plain text for email.
 
Expected timetable shape (matches what /generate_timetable returns,
and what the frontend's own greedy scheduler produces):
 
{
  "<batch>": {
      "<day>": {
          "<slot>": ["<course> - <prof>", ...],
          ...
      },
      ...
  },
  ...
}
"""
 
from typing import Dict, List
 
 
def extract_professor_schedule(
    timetable: Dict, prof_name: str
) -> Dict[str, Dict[str, List[str]]]:
    """
    Returns: { day: { slot: ["<course> (<batch>)", ...] } }
    containing only sessions taught by `prof_name` (case-insensitive,
    whitespace-trimmed match).
    """
    prof_name_norm = prof_name.strip().lower()
    schedule: Dict[str, Dict[str, List[str]]] = {}
 
    for batch, batch_data in timetable.items():
        for day, day_data in batch_data.items():
            for slot, entries in day_data.items():
                for entry in entries:
                    # entries look like "Course Name - Prof Name"
                    if " - " not in entry:
                        continue
                    course_part, prof_part = entry.rsplit(" - ", 1)
                    if prof_part.strip().lower() != prof_name_norm:
                        continue
 
                    schedule.setdefault(day, {}).setdefault(slot, [])
                    schedule[day][slot].append(f"{course_part.strip()} ({batch})")
 
    return schedule
 
 
 
 