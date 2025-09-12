import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def braille_output(request):
    """Handle braille output requests (stub for hardware integration)"""
    try:
        data = json.loads(request.body)
        tokens = data.get('tokens', [])
        mode = data.get('mode', 'once')
        
        if not tokens:
            return JsonResponse({'error': 'Tokens are required'}, status=400)
        
        # Log the braille output request for debugging
        logger.info(f"Braille output request: tokens={tokens}, mode={mode}")
        
        # Simulate hardware processing
        if mode == 'chunked':
            # Process tokens in chunks for long text
            logger.info(f"Processing {len(tokens)} tokens in chunks")
            for i, token in enumerate(tokens):
                logger.info(f"Chunk {i+1}: {token}")
        else:
            # Process all tokens at once
            logger.info(f"Processing all tokens at once: {tokens}")
        
        # Simulate processing delay
        import time
        time.sleep(0.1)
        
        # Return success response
        return JsonResponse({
            'ok': True,
            'message': 'Braille output processed successfully',
            'tokens_processed': len(tokens),
            'mode': mode
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Braille output error: {str(e)}")
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
