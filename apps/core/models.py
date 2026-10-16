import uuid
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ruha_categories')
    name = models.CharField(max_length=60)
    color = models.CharField(max_length=16, default='#64748b')
    icon = models.CharField(max_length=40, blank=True, default='circle')
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['position', 'name']
        constraints = [models.UniqueConstraint(fields=['user', 'name'], name='ruha_category_user_name_uniq')]
    def __str__(self): return self.name

class Item(models.Model):
    TYPE_CHOICES = [('note','یادداشت'),('task','کار'),('reminder','یادآور')]
    STATUS_CHOICES = [('todo','باز'),('doing','در حال انجام'),('done','انجام‌شده'),('cancelled','لغوشده')]
    PRIORITY_CHOICES = [('low','کم'),('medium','متوسط'),('high','زیاد')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ruha_items')
    type = models.CharField(max_length=12, choices=TYPE_CHOICES, default='task')
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True, default='')
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='items')
    tags = models.JSONField(default=list, blank=True)
    priority = models.CharField(max_length=8, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='todo')
    start_at = models.DateTimeField(null=True, blank=True, db_index=True)
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    all_day = models.BooleanField(default=False)
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True)
    recurrence_rule = models.CharField(max_length=250, blank=True, default='')
    recurrence_parent = models.UUIDField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    archived_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['due_at', '-created_at']
        indexes = [models.Index(fields=['user','start_at']), models.Index(fields=['user','due_at']), models.Index(fields=['user','status'])]
    def __str__(self): return self.title

class Attachment(models.Model):
    KIND_CHOICES = [('audio','صوت'),('image','تصویر'),('file','فایل')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='attachments')
    kind = models.CharField(max_length=8, choices=KIND_CHOICES)
    file = models.FileField(upload_to='ruha/private/%Y/%m/', validators=[FileExtensionValidator(['jpg','jpeg','png','webp','gif','bmp','webm','ogg','mp3','m4a','wav','pdf'])])
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=120)
    size = models.PositiveBigIntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    transcript = models.TextField(blank=True, default='')
    ocr_text = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.original_name

class Reminder(models.Model):
    CHANNEL_CHOICES = [('push','Push'),('email','Email')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='reminders')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ruha_reminders')
    remind_at = models.DateTimeField(db_index=True)
    channel = models.CharField(max_length=8, choices=CHANNEL_CHOICES, default='push')
    sent_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [models.Index(fields=['sent_at','remind_at'])]

class TimeEntry(models.Model):
    SOURCE_CHOICES = [('timer','زمان‌سنج'),('manual','دستی'),('planned','برنامه‌ریزی‌شده')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, null=True, blank=True, on_delete=models.SET_NULL, related_name='time_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ruha_time_entries')
    started_at = models.DateTimeField(db_index=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='timer')
    note = models.CharField(max_length=250, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-started_at']

class PushSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ruha_push_subscriptions')
    endpoint = models.URLField(max_length=2048, unique=True)
    keys = models.JSONField(default=dict)
    user_agent = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ShareLink(models.Model):
    PERMISSION_CHOICES = [('read','فقط‌خواندنی')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, null=True, blank=True, on_delete=models.CASCADE, related_name='share_links')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ruha_share_links')
    token_hash = models.CharField(max_length=128, unique=True)
    permission = models.CharField(max_length=8, choices=PERMISSION_CHOICES, default='read')
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
