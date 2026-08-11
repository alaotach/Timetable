import json
import os
from typing import TypedDict, Annotated, Sequence
import operator

from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END

# Import your graph-coloring solver logic & tools
from app.services import create_timetable_pdf, send_pdf_email

# =========================
# STATE DEFINITION
# =========================
class SchedulerState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    timetable_data: dict
    pdf_path: str

# =========================
# AGENT TOOLS
# =========================
@tool
def generate_pdf_and_email_tool(recipient_email: str, timetable_json_str: str) -> str:
    """Creates a PDF from the timetable JSON and emails it to the recipient."""
    try:
        timetable_data = json.loads(timetable_json_str)
        pdf_path = create_timetable_pdf(timetable_data)
        result = send_pdf_email(recipient_email, pdf_path, batch_name="Academic Schedule")
        return result
    except Exception as e:
        return f"Failed to deliver PDF: {str(e)}"

# =========================
# LANGGRAPH WORKFLOW
# =========================
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant"
)

def agent_dispatcher(state: SchedulerState):
    """LLM agent node that decides whether to trigger automated reporting."""
    last_msg = state["messages"][-1]
    
    # Bind tool to the model
    llm_with_tools = llm.bind_tools([generate_pdf_and_email_tool])
    response = llm_with_tools.invoke(state["messages"])
    
    return {"messages": [response]}

# Build Graph
workflow = StateGraph(SchedulerState)
workflow.add_node("agent", agent_dispatcher)
workflow.add_edge(START, "agent")
workflow.add_edge("agent", END)

scheduling_agent = workflow.compile()