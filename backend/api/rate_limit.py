"""Instancia compartida de `Limiter` (slowapi), en módulo propio para evitar import circular con main.py."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
