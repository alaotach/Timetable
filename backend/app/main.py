from fastapi import FastAPI
from pydantic import BaseModel
import networkx as nx

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] for all origins
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

# Build conflict graph
def build_conflict_graph(sessions):
    G = nx.Graph()

    # add nodes
    for node_id, batch, course, prof in sessions:
        G.add_node(node_id, batch=batch, course=course, prof=prof)
        
    # add edges for conflicts
    for i in range(len(sessions)):
        for j in range(i+1, len(sessions)):
            n1, b1, c1, p1 = sessions[i]
            n2, b2, c2, p2 = sessions[j]
            if b1 == b2 or p1 == p2:   # same batch OR same professor
                if n1 != n2:           # avoid self-loops
                    G.add_edge(n1, n2)
    return G

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Timetable Scheduler API is running"}

@app.post("/generate_timetable")
def generate_timetable(req: TimetableRequest):
    # build nodes (sessions)
    sessions = []
    for cl in req.course_loads: #for each different course 
        for i in range(cl.credit): #for each lecture(of same course), create a session
            node_id = f"{cl.course}_{cl.batch}_L{i+1}"
            sessions.append((node_id, cl.batch, cl.course, cl.prof))

    # build conflict graph
    G = build_conflict_graph(sessions)

    # weekly slots
    week_slots = []
    for d in req.days:
        for s in req.slots:
            week_slots.append((d, s))

    # greedy assignment
    assignments = {} # which slot each node gets
    slot_counts = {} # to track number of sessions assigned per slot (since we have limited rooms)

    for node in G.nodes():
        neighbor_slots = set() # slots assigned to neighbors, cant be assigned to this node
        for neigh in G.neighbors(node):
            if neigh in assignments: # check if neighbor is already assigned
                neighbor_slots.add(assignments[neigh])
                #here assignments[neigh] = key is assigned later

        for day, slot in week_slots:
            key = f"{day}_{slot}"

            if key not in neighbor_slots and slot_counts.get(key, 0) < req.rooms_available:
            #if theres no conflict       and rooms are available in that slot
                assignments[node] = key
                slot_counts[key] = slot_counts.get(key, 0) + 1
                break

    
    # initialize timetables for each batch
    batch_timetables = {
        batch: {day: {slot: [] for slot in req.slots} for day in req.days}
        for batch in {cl.batch for cl in req.course_loads}
    }

    # fill timetables based on assignments
    for node, key in assignments.items():
        day, slot = key.split("_")
    # find the batch for this node
        batch = G.nodes[node]["batch"]
        batch_timetables[batch][day][slot].append(node)

    return {"timetable": batch_timetables }