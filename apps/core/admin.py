from django.contrib import admin
from .models import Attachment, Category, Item, PushSubscription, Reminder, ShareLink, TimeEntry

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'status', 'due_at', 'updated_at')
    list_filter = ('type', 'status', 'priority', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'color', 'position')
    search_fields = ('name', 'user__username')

admin.site.register(Attachment)
admin.site.register(Reminder)
admin.site.register(TimeEntry)
admin.site.register(PushSubscription)
admin.site.register(ShareLink)
