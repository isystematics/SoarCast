import datetime
import pytz

from django.conf import settings

from user_profile.models import PasswordHistory


def check_password_expired(user):
    """
    Return True if password is expired and system is using
    password expiration, False otherwise.
    """
    expiry = settings.ACCOUNT_PASSWORD_EXPIRY
    try:
        # get latest password info
        latest = user.password_history.latest("timestamp")
    except PasswordHistory.DoesNotExist:
        return True

    now = datetime.datetime.now(tz=pytz.UTC)
    expiration = latest.timestamp + datetime.timedelta(days=expiry)

    if expiration < now:
        return True
    else:
        return False
