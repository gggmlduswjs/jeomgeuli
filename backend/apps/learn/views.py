import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .data import LearningData


@require_http_methods(["GET"])
def get_next_lesson(request):
    """Get next lesson based on mode"""
    mode = request.GET.get('mode', 'char')
    
    if mode not in ['char', 'word', 'sent', 'free']:
        return JsonResponse({'error': 'Invalid mode'}, status=400)
    
    learning_data = LearningData()
    
    try:
        lesson_data = learning_data.get_lesson(mode)
        return JsonResponse(lesson_data)
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def submit_test(request):
    """Submit test results"""
    try:
        data = json.loads(request.body)
        mode = data.get('mode')
        answers = data.get('answers', [])
        correct_answers = data.get('correct_answers', [])
        
        # Calculate score
        correct = 0
        total = len(answers)
        
        for i, answer in enumerate(answers):
            if i < len(correct_answers) and answer == correct_answers[i]:
                correct += 1
        
        score = (correct / total * 100) if total > 0 else 0
        
        # Return test results
        return JsonResponse({
            'score': score,
            'correct': correct,
            'total': total,
            'incorrect_answers': [
                {
                    'question': answers[i],
                    'correct': correct_answers[i] if i < len(correct_answers) else '',
                    'user_answer': answer
                }
                for i, answer in enumerate(answers)
                if i >= len(correct_answers) or answer != correct_answers[i]
            ]
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
