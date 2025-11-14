# 학습 데이터 Fixtures

이 폴더에는 학습 초기 데이터가 포함되어 있습니다.

## 사용법

```bash
# 모든 학습 데이터 로드
python manage.py loaddata lesson_chars lesson_words lesson_sentences lesson_keywords

# 특정 데이터만 로드
python manage.py loaddata lesson_chars
```

## 데이터 소스

- `lesson_chars.json`: 자모 학습 데이터
- `lesson_words.json`: 단어 학습 데이터  
- `lesson_sentences.json`: 문장 학습 데이터
- `lesson_keywords.json`: 키워드 학습 데이터

## 주의사항

- Fixtures는 초기 데이터/시드 데이터용입니다
- 프로덕션 환경에서는 마이그레이션과 함께 배포됩니다
- 데이터 수정 시 Fixtures 파일을 업데이트하고 다시 로드해야 합니다

