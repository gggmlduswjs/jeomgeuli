from django.urls import path
from . import views

urlpatterns = [
    path('next/', views.get_next_lesson, name='next_lesson'),
    path('test/', views.submit_test, name='submit_test'),
]
