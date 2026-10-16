from django.urls import path
from . import views

urlpatterns = [
    path('auth/register', views.register, name='api-register'),
    path('auth/login', views.login_view, name='api-login'),
    path('auth/logout', views.logout_view, name='api-logout'),
    path('auth/me', views.me, name='api-me'),
    path('items', views.items, name='api-items'),
    path('items/<uuid:item_id>', views.item_detail, name='api-item-detail'),
    path('items/<uuid:item_id>/complete', views.complete_item, name='api-item-complete'),
    path('items/<uuid:item_id>/snooze', views.snooze_item, name='api-item-snooze'),
    path('categories', views.categories, name='api-categories'),
    path('items/<uuid:item_id>/attachments', views.upload_attachment, name='api-attachment-upload'),
    path('attachments/<uuid:attachment_id>', views.attachment_download, name='api-attachment-download'),
    path('timer/start', views.timer_start, name='api-timer-start'),
    path('timer/stop', views.timer_stop, name='api-timer-stop'),
    path('time-entries', views.time_entries, name='api-time-entries'),
    path('stats/progress', views.stats_progress, name='api-stats-progress'),
    path('stats/time-spent', views.stats_time_spent, name='api-stats-time'),
    path('push/subscribe', views.push_subscribe, name='api-push-subscribe'),
    path('push/unsubscribe', views.push_unsubscribe, name='api-push-unsubscribe'),
    path('export', views.export_data, name='api-export'),
]
