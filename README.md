# Graph-Based Timetable Scheduler

An automated academic timetable scheduling application that uses **Graph Theory, Conflict Graphs, and Graph Coloring** to generate conflict-free timetables across student batches, professors, days, time slots, and available classrooms.

The system automatically detects scheduling conflicts, respects room capacity constraints, generates printable PDF timetables, and enables personalized professor schedule notifications through EmailJS.

## Features

- **Graph-Based Scheduling**
  - Models timetable scheduling as a graph coloring problem using NetworkX.
  - Represents each required lecture session as a graph vertex.
  - Creates conflict edges between sessions that share the same batch or professor.

- **Conflict-Free Allocation**
  - Prevents two lectures belonging to the same student batch from occupying the same time slot.
  - Prevents professors from being assigned to multiple lectures in the same time slot.
  - Produces a conflict-free timetable within the configured scheduling constraints.

- **Room Constraint Management**
  - Limits the number of simultaneously scheduled lectures according to available classrooms.
  - Tracks total room usage for every day and time slot.

- **PDF Timetable Export**
  - Automatically generates a clean, printable PDF timetable.
  - Provides batch-wise timetable layouts using `jsPDF` and `AutoTable`.

- **Personalized Professor Notifications**
  - Sends the complete timetable to a specified email address.
  - Extracts individual professor schedules from the generated timetable.
  - Sends professor-specific schedules through EmailJS.

- **Professor Directory Import**
  - Supports importing professor information from `.json` and `.csv` files.
  - Allows administrators to select specific professors before sending personalized schedules.

- **Batch-Wise Timetable Views**
  - Displays schedules independently for different student batches.
  - Supports multi-department and multi-batch scheduling.

---

## Tech Stack

### Frontend

- React.js
- Vite
- jsPDF
- jsPDF-AutoTable
- EmailJS

### Backend

- FastAPI
- Python 3.9+
- NetworkX
- Pydantic
- Uvicorn

---

## System Architecture

The application consists of two primary components:

```text
                +----------------------+
                |      React Frontend  |
                |                      |
                |  Course Input        |
                |  Constraints         |
                |  Timetable Display   |
                |  PDF Export          |
                |  Email Notifications |
                +----------+-----------+
                           |
                           | HTTP API
                           v
                +----------------------+
                |     FastAPI Backend  |
                |                      |
                |  Data Validation     |
                |  Conflict Detection  |
                |  Graph Construction  |
                |  Graph Coloring      |
                |  Schedule Generation |
                +----------+-----------+
                           |
                           v
                +----------------------+
                |   NetworkX Graph     |
                |                      |
                |  Vertices = Sessions |
                |  Edges = Conflicts   |
                |  Colors = Time Slots |
                +----------------------+
```
## Personalised Timetable Sharing
- The scheduler goes beyond generating a single timetable.
- It automatically parses the generated timetable, identifies each professor's classes, formats their individual weekly schedule, and sends it directly to their email using EmailJS.
- This means professors receive only the sessions they need to teach, rather than having to search through the complete institutional timetable.

## Professor Directory
JSON
```
[
  {
    "prof_id": "1",
    "name": "Dr. Sharma",
    "email": "sharma@example.com"
  },
  {
    "prof_id": "2",
    "name": "Dr. Verma",
    "email": "verma@example.com"
  }
]
```
CSV
```
name,email,prof_id
Dr. Sharma,sharma@example.com,1
Dr. Verma,verma@example.com,2
```
## Current Assumptions
Each lecture lasts 1 hour.
Professors are assumed available during all configured slots.
Rooms are treated as identical capacity units.
Greedy scheduling currently prioritises earlier available slots, so multi-credit courses may not be evenly distributed across the week.

## Status
- Conflict-free global timetable generation
- Batch-wise timetable views
- Room constraint handling
- PDF generation
- Professor-specific schedule extraction
- Personalised email notifications
- JSON/CSV professor directory import