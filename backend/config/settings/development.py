from .base import *

DATABASES = { 
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'fullstack_develop_example_at_django_nextjs',
        'USER': 'postgres',
        'PASSWORD': 'example',
        'HOST': 'db',
        'PORT': '5432',
        'ATOMIC_REQUESTS': True
    }
}