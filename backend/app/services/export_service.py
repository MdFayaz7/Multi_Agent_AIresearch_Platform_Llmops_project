import io
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.enums import TA_LEFT


def build_markdown(doc: dict) -> str:
    lines = [
        f"# {doc.get('topic', 'Research Report')}",
        "",
        f"*Status:* {doc.get('status')}  ",
        f"*Created:* {doc.get('created_at')}  ",
        f"*Completed:* {doc.get('completed_at', 'N/A')}",
        "",
        "## Report",
        "",
        doc.get("report") or "_No report generated._",
        "",
        "## Critic Feedback",
        "",
        doc.get("critic_feedback") or "_No feedback available._",
        "",
        "## Sources",
        "",
    ]
    sources = doc.get("sources") or []
    if sources:
        lines += [f"- {s}" for s in sources]
    else:
        lines.append("_No sources recorded._")

    timings = doc.get("agent_timings") or {}
    if timings:
        lines += ["", "## Agent Execution Times", ""]
        for k, v in timings.items():
            if v is not None:
                lines.append(f"- **{k.capitalize()}**: {v}s")

    return "\n".join(lines)


def build_pdf(doc: dict) -> bytes:
    buffer = io.BytesIO()
    pdf_doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2 * cm, leftMargin=2 * cm, rightMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], alignment=TA_LEFT)
    h2 = ParagraphStyle("H2X", parent=styles["Heading2"], spaceBefore=14)
    body = ParagraphStyle("BodyX", parent=styles["BodyText"], leading=16)

    def esc(text: str) -> str:
        return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    story = [
        Paragraph(esc(doc.get("topic", "Research Report")), title_style),
        Spacer(1, 6),
        Paragraph(f"Status: {esc(doc.get('status'))} &nbsp;|&nbsp; Created: {doc.get('created_at')}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph("Report", h2),
    ]
    report_text = esc(doc.get("report") or "No report generated.").replace("\n", "<br/>")
    story.append(Paragraph(report_text, body))

    story.append(Paragraph("Critic Feedback", h2))
    feedback_text = esc(doc.get("critic_feedback") or "No feedback available.").replace("\n", "<br/>")
    story.append(Paragraph(feedback_text, body))

    sources = doc.get("sources") or []
    story.append(Paragraph("Sources", h2))
    if sources:
        story.append(ListFlowable(
            [ListItem(Paragraph(esc(s), body)) for s in sources],
            bulletType="bullet",
        ))
    else:
        story.append(Paragraph("No sources recorded.", body))

    pdf_doc.build(story)
    buffer.seek(0)
    return buffer.read()
