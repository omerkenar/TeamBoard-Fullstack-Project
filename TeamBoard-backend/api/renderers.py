# api/renderers.py
from rest_framework.renderers import JSONRenderer


class CustomJSONRenderer(JSONRenderer):
    
    """
    Başarılı (exception olmayan) tüm response'ları şu formatta sarmalanır: 
    {
      "success": true,
      "message": "İşlem başarılı.",
      "data": ...
    }

    Hatalar (exception=True) global exception handler'dan zaten
    {"success": false, "message": ..., "errors": ...} formatında geliyor,
    onları aynen bıraktık.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get('response')

        
        if response is not None and getattr(response, 'exception', False):
            return super().render(data, accepted_media_type, renderer_context)

        
        if isinstance(data, dict) and 'success' in data:
            return super().render(data, accepted_media_type, renderer_context)

       
        message = None
        if isinstance(data, dict):

            message = data.pop('message', None)

        envelope = {
            'success': True,
            'message': message or 'İşlem başarılı.',
            'data': data,
        }

        return super().render(envelope, accepted_media_type, renderer_context)
