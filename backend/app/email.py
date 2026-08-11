# def send_pdf_email(recipient_email: str, pdf_path: str, batch_name: str) -> str:
#     """Sends the generated PDF via Email."""
#     sender_email = os.getenv("SENDER_EMAIL")
#     sender_password = os.getenv("SENDER_PASSWORD") # App-specific password

#     msg = EmailMessage()
    
#     msg['Subject'] = f"Generated Timetable Schedule - {batch_name}"
#     msg['From'] = sender_email
#     msg['To'] = recipient_email
#     msg.set_content("Hello,\n\nPlease find attached the generated academic timetable.\n\nBest regards,\nAutomated Scheduler Engine")

#     # Attach PDF
#     with open(pdf_path, 'rb') as f:
#         msg.add_attachment(f.read(), maintype='application', subtype='pdf', filename=os.path.basename(pdf_path))

#     # Send Email via SMTP
#     with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
#         smtp.login(sender_email, sender_password)
#         smtp.send_message(msg)

#     return f"Successfully sent PDF timetable to {recipient_email}"