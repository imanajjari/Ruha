from pathlib import Path
from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import include, path
from django.views.decorators.cache import never_cache
from django.views.generic import TemplateView

BASE_DIR = Path(__file__).resolve().parent.parent

@never_cache
def pwa_manifest(request):
    return FileResponse(open(BASE_DIR / 'manifest.webmanifest', 'rb'), content_type='application/manifest+json')

@never_cache
def service_worker(request):
    response = FileResponse(open(BASE_DIR / 'sw.js', 'rb'), content_type='application/javascript')
    response['Service-Worker-Allowed'] = '/'
    response['Cache-Control'] = 'no-cache'
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.core.urls')),
    path('manifest.webmanifest', pwa_manifest, name='manifest'),
    path('sw.js', service_worker, name='service-worker'),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index.html', TemplateView.as_view(template_name='index.html'), name='index'),
]
