import binascii
import os
import base64

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from cryptography.fernet import Fernet, InvalidToken
from rest_framework.authentication import get_authorization_header


def create_key_from_secret():
    password_provided = settings.SECRET_KEY # This is input in the form of a string
    password = password_provided.encode()  # Convert to type bytes
    salt = b'salt_'  # CHANGE THIS - recommend using a key from os.urandom(16), must be of type bytes
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return key


def create_hashed_token(app=None, user=None):
    if not app and not user:
        raise ValueError('App or user required')
    token = binascii.hexlify(os.urandom(20)).decode()
    from .models import HashedToken
    obj, created = HashedToken.objects.update_or_create(app=app, user=user, defaults={'key': token})
    key = create_key_from_secret()
    f = Fernet(key)
    not_encrypted = '{}:{}'.format(obj.id, token).encode()
    return f.encrypt(not_encrypted)


class HashedTokenAuthentication(authentication.BaseAuthentication):
    """
    Simple token based authentication.

    Clients should authenticate by passing the token key in the "Authorization"
    HTTP header, prepended with the string "Token ".  For example:

        Authorization: Token 401f7ac837da42b97f613d789819ff93537bee6a
    """
    keyword = 'Token'

    def authenticate(self, request):
        from .models import HashedToken
        try:
            auth = get_authorization_header(request).split()
            if not auth or auth[0].lower() in ['bearer', 'token']:
                return None
            token = auth[1]
            key = create_key_from_secret()
            f = Fernet(key)

            hash_str = f.decrypt(token)
            hash_id, hash_token = hash_str.decode().split(':')
            hash_obj = HashedToken.objects.get(id=hash_id, key=hash_token)
            return (hash_obj.app or hash_obj.user, None)
        except (TypeError, HashedToken.DoesNotExist, ValueError, InvalidToken, IndexError):
            return None
