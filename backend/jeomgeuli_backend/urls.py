from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chat/', include('apps.chat.urls')),
    path('api/learn/', include('apps.learn.urls')),
    path('api/braille/', include('apps.braille.urls')),
]
