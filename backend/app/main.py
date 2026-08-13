from fastapi import Request, FastAPI, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel
import networkx as nx
from typing import Dict, List
from agents import TTextract, emailSender   # <- profDir import removed
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class CourseLoad(BaseModel):
    batch: str
    course: str
    prof: str
    credit: int

class TimetableRequest(BaseModel):
    course_loads: list[CourseLoad]
    days: list[str]
    slots: list[str]
    rooms_available: int


def build_conflict_graph(sessions):
    G = nx.Graph()
    for node_id, batch, course, prof in sessions:
        G.add_node(node_id, batch=batch, course=course, prof=prof)
    for i in range(len(sessions)):
        for j in range(i + 1, len(sessions)):
            n1, b1, c1, p1 = sessions[i]
            n2, b2, c2, p2 = sessions[j]
            if b1 == b2 or p1 == p2:
                if n1 != n2:
                    G.add_edge(n1, n2)
    return G


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Timetable Scheduler API is running"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )


@app.post("/generate_timetable")
def generate_timetable(req: TimetableRequest):
    sessions = []
    for cl in req.course_loads:
        for i in range(cl.credit):
            node_id = f"{cl.course}_{cl.batch}_L{i+1}"
            sessions.append((node_id, cl.batch, cl.course, cl.prof))

    G = build_conflict_graph(sessions)

    week_slots = []
    for d in req.days:
        for s in req.slots:
            week_slots.append((d, s))

    assignments = {}
    slot_counts = {}

    for node in G.nodes():
        neighbor_slots = set()
        for neigh in G.neighbors(node):
            if neigh in assignments:
                neighbor_slots.add(assignments[neigh])

        for day, slot in week_slots:
            key = f"{day}_{slot}"
            if key not in neighbor_slots and slot_counts.get(key, 0) < req.rooms_available:
                assignments[node] = key
                slot_counts[key] = slot_counts.get(key, 0) + 1
                break

    batch_timetables = {
        batch: {day: {slot: [] for slot in req.slots} for day in req.days}
        for batch in {cl.batch for cl in req.course_loads}
    }

    for node, key in assignments.items():
        day, slot = key.split("_")
        batch = G.nodes[node]["batch"]
        batch_timetables[batch][day][slot].append(node)

    return {"timetable": batch_timetables}



