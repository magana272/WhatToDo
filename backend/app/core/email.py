import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")


def send_password_reset_email(email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL]):
        print(f"SMTP not configured. Reset link for {email}: {reset_link}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset - WhatToDo"
    msg["From"] = FROM_EMAIL
    msg["To"] = email

    text = (
        f"Reset your password by visiting: {reset_link}\n\n"
        "This link expires in 15 minutes."
    )
    html = f"""\
<html>
<body>
    <h2>Password Reset</h2>
    <p>You requested a password reset for your WhatToDo account.</p>
    <p><a href="{reset_link}">Click here to reset your password</a></p>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
</body>
</html>"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, email, msg.as_string())