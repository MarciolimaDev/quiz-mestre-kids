import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

res = get_resolver()
patterns = []

def walk(ps, prefix=''):
    for p in ps:
        if isinstance(p, URLPattern):
            patterns.append(prefix + str(p.pattern))
        elif isinstance(p, URLResolver):
            walk(p.url_patterns, prefix + str(p.pattern))

walk(res.url_patterns)
for p in patterns:
    print(p)
