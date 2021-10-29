import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils.html import linebreaks

from app.models import EmailSetting
from app.utils import read_secret
from .models import Notification

log = logging.getLogger(__name__)


def create_notification(subject, notification_type, text):
    Notification.objects.create(
        subject=subject,
        notification_type=notification_type,
        message=text
    )


def send_email(subject: str, message: str, emails: list, domain_url: str = None):
    email_setting = EmailSetting.objects.first()
    if not email_setting:
        log.error('No email settings')
        return False
    email_connection = get_connection(
        host=email_setting.email_host,
        port=email_setting.email_port,
        username=email_setting.email_username,
        password=read_secret('public', 'email-password'),
        use_tls=bool(email_setting.use_tls),
        use_ssl=bool(email_setting.use_ssl)
    )
    html_content = text_content = linebreaks(message)
    if domain_url:
        html_content = html_content.replace('href="/', 'href="{}/'.format(domain_url))
    else:
        html_content = html_content.replace('href="/', settings.DOMAIN_URL)
    msg = EmailMultiAlternatives(
        "{} - {}".format('MissionControl', subject),
        text_content,
        email_setting.from_email,
        emails,
        connection=email_connection
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    return True


def send_notification_email(notification, emails):
    send_email(
        notification.subject,
        notification.message,
        emails
    )
