from django.urls import path
from . import views

urlpatterns = [
    path("encode/", views.braille_convert, name="braille_encode"),
    path("convert/", views.braille_convert, name="braille_convert"),  # legacy compatibility
    path("packets/", views.braille_packets, name="braille_packets"),  # packets only endpoint
    path("", views.braille_convert, name="braille_convert_root"),  # /api/convert/ 호환
]