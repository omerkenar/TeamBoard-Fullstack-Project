import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (APIException, NotAuthenticated,
                                       NotFound, PermissionDenied,
                                       ValidationError)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):

    response = drf_exception_handler(exc, context)
    view = context.get('view')

    if response is None:
        logger.exception(
            'Unhandled exception in view %s: %s',
            getattr(view, '__class__', type(view)).__name__,
            exc,
        )

        return Response(
            {'success': False,
            'message': 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.',
            'errors': None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    status_code = response.status_code
    original_data = response.data

    message = None
    errors = None

    # 400 - Validation error
    if isinstance(exc, ValidationError):
        message = "Gönderdiğiniz veriler geçersiz."
        errors = original_data

    # 401 - Not authenticated
    elif isinstance(exc, NotAuthenticated):
        message = "Bu işlemi yapmak için giriş yapmanız gerekiyor."
        errors = None

    # 403 - Permission denied
    elif isinstance(exc, (PermissionDenied, DjangoPermissionDenied)):
        message = "Bu işlem için yetkiniz yok."
        errors = None

    # 404 - Not found
    elif isinstance(exc, (NotFound, Http404)):
        message = "İstediğiniz kaynak bulunamadı."
        errors = None

    # DRF APIException veya diğer 4xx durumlar
    elif isinstance(exc, APIException):
        # response.data genelde {"detail": "..."} formatında
        detail = original_data.get("detail") if isinstance(original_data, dict) else None
        message = detail or "İşlem sırasında bir hata oluştu."
        errors = original_data

    else:
        # Her ihtimale karşı fallback
        detail = original_data.get("detail") if isinstance(original_data, dict) else None
        message = detail or "İşlem gerçekleştirilemedi."
        errors = original_data

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }
    response.status_code = status_code
    return response


class BusinessLogicException(APIException):

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "İş kuralı hatası."
    default_code = "business_error"

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail, code)

