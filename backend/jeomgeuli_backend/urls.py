from django.urls import path
from . import views

urlpatterns = [
    path("api/health/", views.health),

    # 학습 데이터
    path("api/learn/char/", views.learn_chars),
    path("api/learn/word/", views.learn_words),
    path("api/learn/sentence/", views.learn_sentences),

    # 점자 변환
    path("api/braille/convert/", views.braille_convert),

    # 복습 노트(파일 기반)
    path("api/review/add/", views.review_add),
    path("api/review/today/", views.review_today),

    # 뉴스 카드(구글 뉴스 RSS)
    path("api/news/cards/", views.news_cards),
]
