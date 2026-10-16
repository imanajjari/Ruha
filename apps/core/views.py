import csv
import hashlib
import json
import secrets
from datetime import timedelta
from io import StringIO
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Count
from django.http import FileResponse, Http404, HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Attachment, Category, Item, PushSubscription, Reminder, TimeEntry


def dt_value(value):
    if not value:
        return None
    parsed = parse_datetime(str(value))
    if parsed is None:
        raise ValueError('تاریخ باید ISO-8601 معتبر باشد.')
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def category_dict(cat):
    return {'id': str(cat.id), 'name': cat.name, 'color': cat.color, 'icon': cat.icon, 'position': cat.position}


def item_dict(item, include_attachments=True):
    obj = {
        'id': str(item.id), 'type': item.type, 'title': item.title, 'description': item.description,
        'categoryId': str(item.category_id) if item.category_id else None, 'tags': item.tags,
        'priority': item.priority, 'status': item.status,
        'startAt': item.start_at.isoformat() if item.start_at else None,
        'dueAt': item.due_at.isoformat() if item.due_at else None,
        'duration': item.estimated_minutes, 'repeat': item.recurrence_rule,
        'archived': bool(item.archived_at), 'deletedAt': item.deleted_at.isoformat() if item.deleted_at else None,
        'completedAt': item.completed_at.isoformat() if item.completed_at else None,
        'createdAt': item.created_at.isoformat(), 'updatedAt': item.updated_at.isoformat(), 'version': item.version,
    }
    if include_attachments:
        obj['attachments'] = [{
            'id': str(a.id), 'kind': a.kind, 'name': a.original_name, 'mime': a.mime_type,
            'size': a.size, 'duration': a.duration_seconds, 'url': f'/api/v1/attachments/{a.id}',
            'createdAt': a.created_at.isoformat(),
        } for a in item.attachments.all()]
    return obj


def get_owned_item(request, item_id):
    try:
        return Item.objects.select_related('category').prefetch_related('attachments').get(id=item_id, user=request.user)
    except Item.DoesNotExist:
        raise Http404('آیتم پیدا نشد.')


def schedule_default_reminder(item, minutes=0):
    if item.due_at and item.type != 'note' and item.status != 'done':
        remind_at = item.due_at - timedelta(minutes=max(0, min(43200, int(minutes or 0))))
        Reminder.objects.create(item=item, user=item.user, remind_at=remind_at, channel='push')


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    username = str(data.get('email', data.get('username', ''))).strip().lower()
    password = str(data.get('password', ''))
    display_name = str(data.get('display_name', data.get('displayName', ''))).strip()
    if not username or '@' not in username:
        return Response({'detail': 'ایمیل معتبر وارد کنید.'}, status=400)
    if len(password) < 10:
        return Response({'detail': 'رمز عبور باید حداقل ۱۰ کاراکتر باشد.'}, status=400)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if User.objects.filter(username=username).exists() or User.objects.filter(email=username).exists():
        return Response({'detail': 'این ایمیل قبلاً ثبت شده است.'}, status=400)
    try:
        validate_password(password)
    except ValidationError as exc:
        return Response({'detail': list(exc.messages)}, status=400)
    user = User.objects.create_user(username=username, email=username, password=password, first_name=display_name[:150])
    login(request, user)
    return Response({'id': user.id, 'email': user.email, 'displayName': user.first_name}, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = str(request.data.get('email', request.data.get('username', ''))).strip().lower()
    password = str(request.data.get('password', ''))
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({'detail': 'ایمیل یا رمز عبور درست نیست.'}, status=400)
    login(request, user)
    return Response({'id': user.id, 'email': user.email, 'displayName': user.first_name})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({'id': request.user.id, 'email': request.user.email, 'displayName': request.user.first_name, 'timezone': 'Asia/Tehran'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def items(request):
    if request.method == 'GET':
        qs = Item.objects.filter(user=request.user, deleted_at__isnull=True).select_related('category').prefetch_related('attachments')
        status_filter = request.query_params.get('status')
        category_filter = request.query_params.get('category')
        date_filter = request.query_params.get('date')
        q = request.query_params.get('q', '').strip()
        if status_filter: qs = qs.filter(status=status_filter)
        if category_filter: qs = qs.filter(category_id=category_filter)
        if date_filter:
            dt = dt_value(date_filter)
            if dt: qs = qs.filter(due_at__date=timezone.localtime(dt).date())
        if q: qs = qs.filter(title__icontains=q) | qs.filter(description__icontains=q)
        return Response([item_dict(i) for i in qs.order_by('due_at', '-created_at')[:1000]])

    data = request.data
    title = str(data.get('title', '')).strip()
    if not title: return Response({'detail': 'عنوان الزامی است.'}, status=400)
    if len(title) > 180: return Response({'detail': 'عنوان بیش از حد طولانی است.'}, status=400)
    try:
        due = dt_value(data.get('dueAt', data.get('due_at')))
        start = dt_value(data.get('startAt', data.get('start_at')))
        category = None
        category_id = data.get('categoryId', data.get('category'))
        if category_id: category = Category.objects.get(id=category_id, user=request.user)
    except (ValueError, Category.DoesNotExist) as exc:
        return Response({'detail': str(exc) or 'دسته‌بندی یا تاریخ نامعتبر است.'}, status=400)
    type_value = data.get('type', 'task')
    status_value = data.get('status', 'todo')
    priority = data.get('priority', 'medium')
    if type_value not in dict(Item.TYPE_CHOICES) or status_value not in dict(Item.STATUS_CHOICES) or priority not in dict(Item.PRIORITY_CHOICES):
        return Response({'detail': 'نوع، وضعیت یا اولویت نامعتبر است.'}, status=400)
    try:
        duration = int(data.get('duration', data.get('estimated_minutes')) or 0) or None
    except (ValueError, TypeError):
        return Response({'detail': 'مدت تخمینی نامعتبر است.'}, status=400)
    if duration and not 1 <= duration <= 1440: return Response({'detail': 'مدت باید بین ۱ و ۱۴۴۰ دقیقه باشد.'}, status=400)
    with transaction.atomic():
        item = Item.objects.create(user=request.user, type=type_value, title=title,
            description=str(data.get('description', ''))[:10000], category=category,
            tags=data.get('tags') if isinstance(data.get('tags'), list) else [], priority=priority,
            status=status_value, due_at=due, start_at=start, estimated_minutes=duration,
            recurrence_rule=str(data.get('repeat', data.get('recurrence_rule', '')) or '')[:250])
        schedule_default_reminder(item, data.get('remindMinutes', 0))
    return Response(item_dict(item), status=201)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def item_detail(request, item_id):
    item = get_owned_item(request, item_id)
    if request.method == 'GET': return Response(item_dict(item))
    if request.method == 'DELETE':
        item.deleted_at = timezone.now(); item.version += 1; item.save(update_fields=['deleted_at','version','updated_at'])
        return Response(status=204)
    data = request.data
    fields = {'title':'title','description':'description','type':'type','status':'status','priority':'priority','tags':'tags'}
    for key, attr in fields.items():
        if key in data:
            value = data[key]
            if key == 'title':
                value = str(value).strip()
                if not value or len(value)>180: return Response({'detail':'عنوان نامعتبر است.'},status=400)
            if key == 'description': value = str(value)[:10000]
            if key == 'tags' and not isinstance(value,list): return Response({'detail':'tags باید آرایه باشد.'},status=400)
            setattr(item, attr, value)
    try:
        if 'dueAt' in data or 'due_at' in data: item.due_at=dt_value(data.get('dueAt',data.get('due_at')))
        if 'startAt' in data or 'start_at' in data: item.start_at=dt_value(data.get('startAt',data.get('start_at')))
        if 'duration' in data or 'estimated_minutes' in data: item.estimated_minutes=int(data.get('duration',data.get('estimated_minutes')) or 0) or None
        if 'categoryId' in data or 'category' in data:
            cid=data.get('categoryId',data.get('category'));item.category=Category.objects.get(id=cid,user=request.user) if cid else None
    except (ValueError, Category.DoesNotExist, TypeError): return Response({'detail':'زمان، مدت یا دسته‌بندی نامعتبر است.'},status=400)
    if item.type not in dict(Item.TYPE_CHOICES) or item.status not in dict(Item.STATUS_CHOICES) or item.priority not in dict(Item.PRIORITY_CHOICES): return Response({'detail':'مقدار نامعتبر است.'},status=400)
    item.version += 1
    item.save()
    if 'dueAt' in data or 'due_at' in data: schedule_default_reminder(item, data.get('remindMinutes',0))
    return Response(item_dict(item))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_item(request, item_id):
    item = get_owned_item(request, item_id)
    done = bool(request.data.get('done', item.status != 'done'))
    item.status = 'done' if done else 'todo'
    item.completed_at = timezone.now() if done else None
    item.version += 1
    item.save(update_fields=['status','completed_at','version','updated_at'])
    return Response(item_dict(item))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def snooze_item(request, item_id):
    item = get_owned_item(request, item_id)
    try: minutes = max(1, min(10080, int(request.data.get('minutes',10))))
    except (ValueError, TypeError): minutes = 10
    item.due_at = timezone.now() + timedelta(minutes=minutes)
    item.version += 1
    item.save(update_fields=['due_at','version','updated_at'])
    item.reminders.filter(sent_at__isnull=True).delete()
    schedule_default_reminder(item,0)
    return Response(item_dict(item))


@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def categories(request):
    if request.method == 'GET': return Response([category_dict(c) for c in Category.objects.filter(user=request.user)])
    name = str(request.data.get('name','')).strip()
    color = str(request.data.get('color','#64748b'))
    if not name or len(name)>60: return Response({'detail':'نام دسته معتبر نیست.'},status=400)
    if not color.startswith('#') or len(color) not in (4,7): color='#64748b'
    obj, created = Category.objects.get_or_create(user=request.user,name=name,defaults={'color':color,'icon':str(request.data.get('icon','circle'))[:40]})
    return Response(category_dict(obj),status=201 if created else 200)


def sniff_upload(file_obj):
    """Identify supported uploads from their signature, not just the filename/MIME header."""
    file_obj.seek(0)
    head = file_obj.read(32)
    file_obj.seek(0)
    if head.startswith(b'\x89PNG\r\n\x1a\n'): return 'image/png', 'image'
    if head.startswith(b'\xff\xd8\xff'): return 'image/jpeg', 'image'
    if head.startswith((b'GIF87a', b'GIF89a')): return 'image/gif', 'image'
    if head.startswith(b'RIFF') and head[8:12] == b'WEBP': return 'image/webp', 'image'
    if head.startswith(b'BM'): return 'image/bmp', 'image'
    if head.startswith(b'%PDF-'): return 'application/pdf', 'file'
    if head.startswith(b'OggS'): return 'audio/ogg', 'audio'
    if head.startswith(b'RIFF') and head[8:12] == b'WAVE': return 'audio/wav', 'audio'
    if head.startswith(b'ID3') or (len(head) > 1 and head[0] == 0xff and (head[1] & 0xe0) == 0xe0): return 'audio/mpeg', 'audio'
    if head.startswith(b'\x1a\x45\xdf\xa3'): return 'audio/webm', 'audio'
    if len(head) >= 12 and head[4:8] == b'ftyp': return 'audio/mp4', 'audio'
    return None, None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_attachment(request, item_id):
    item = get_owned_item(request,item_id)
    file = request.FILES.get('file')
    if not file: return Response({'detail':'فایل ارسال نشده است.'},status=400)
    if file.size > 15*1024*1024: return Response({'detail':'حداکثر حجم فایل ۱۵ مگابایت است.'},status=400)
    mime, kind = sniff_upload(file)
    if not mime:
        return Response({'detail':'ساختار فایل شناسایی نشد؛ فقط عکس، صوت و PDF معتبر پذیرفته می‌شوند.'},status=400)
    # Keep attachments private: only the authenticated download endpoint exposes them.
    att=Attachment.objects.create(item=item,kind=kind,file=file,original_name=file.name[:255],mime_type=mime,size=file.size)
    return Response({'id':str(att.id),'kind':att.kind,'name':att.original_name,'size':att.size,'url':f'/api/v1/attachments/{att.id}'},status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attachment_download(request, attachment_id):
    try: att=Attachment.objects.select_related('item').get(id=attachment_id,item__user=request.user)
    except Attachment.DoesNotExist: raise Http404('پیوست پیدا نشد.')
    try:
        f=att.file.open('rb')
    except OSError: raise Http404('فایل در دسترس نیست.')
    response=FileResponse(f,content_type=att.mime_type or 'application/octet-stream')
    response['Content-Disposition'] = f"inline; filename*=UTF-8''{quote(att.original_name)}"
    response['X-Content-Type-Options']='nosniff'
    response['Cache-Control']='private, no-store'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def timer_start(request):
    item_id=request.data.get('itemId')
    item=None
    if item_id:
        try:item=Item.objects.get(id=item_id,user=request.user,deleted_at__isnull=True)
        except Item.DoesNotExist:return Response({'detail':'کار پیدا نشد.'},status=404)
    active=TimeEntry.objects.filter(user=request.user,ended_at__isnull=True).first()
    if active:return Response({'detail':'یک زمان‌سنج دیگر در حال اجراست.','entryId':str(active.id)},status=409)
    entry=TimeEntry.objects.create(user=request.user,item=item,started_at=timezone.now(),source='timer')
    if item and item.status=='todo':item.status='doing';item.save(update_fields=['status','updated_at'])
    return Response({'id':str(entry.id),'startedAt':entry.started_at.isoformat()},status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def timer_stop(request):
    entry_id=request.data.get('entryId')
    qs=TimeEntry.objects.filter(user=request.user,ended_at__isnull=True)
    if entry_id: qs=qs.filter(id=entry_id)
    entry=qs.first()
    if not entry:return Response({'detail':'زمان‌سنج فعالی پیدا نشد.'},status=404)
    entry.ended_at=timezone.now();entry.save(update_fields=['ended_at'])
    return Response({'id':str(entry.id),'startedAt':entry.started_at.isoformat(),'endedAt':entry.ended_at.isoformat(),'minutes':round((entry.ended_at-entry.started_at).total_seconds()/60,2)})


@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def time_entries(request):
    if request.method=='GET':
        qs=TimeEntry.objects.filter(user=request.user).select_related('item')[:1000]
        return Response([{'id':str(e.id),'itemId':str(e.item_id) if e.item_id else None,'startedAt':e.started_at.isoformat(),'endedAt':e.ended_at.isoformat() if e.ended_at else None,'source':e.source,'note':e.note} for e in qs])
    try:
        started=dt_value(request.data.get('startedAt')) or timezone.now();ended=dt_value(request.data.get('endedAt'))
        item=Item.objects.get(id=request.data['itemId'],user=request.user) if request.data.get('itemId') else None
    except (ValueError,Item.DoesNotExist,KeyError):return Response({'detail':'پارامتر نامعتبر است.'},status=400)
    if ended and ended<started:return Response({'detail':'پایان قبل از شروع است.'},status=400)
    entry=TimeEntry.objects.create(user=request.user,item=item,started_at=started,ended_at=ended,source=request.data.get('source','manual') if request.data.get('source') in dict(TimeEntry.SOURCE_CHOICES) else 'manual',note=str(request.data.get('note',''))[:250])
    return Response({'id':str(entry.id),'startedAt':entry.started_at.isoformat(),'endedAt':entry.ended_at.isoformat() if entry.ended_at else None},status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_progress(request):
    range_key=request.query_params.get('range','week')
    days={'day':1,'week':7,'month':30}.get(range_key,7)
    since=timezone.now()-timedelta(days=days)
    items_qs=Item.objects.filter(user=request.user,deleted_at__isnull=True,created_at__gte=since)
    total=items_qs.count();done=items_qs.filter(status='done').count()
    return Response({'range':range_key,'days':days,'total':total,'completed':done,'rate':round(done/total*100) if total else 0,'overdue':items_qs.filter(due_at__lt=timezone.now()).exclude(status='done').count()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_time_spent(request):
    range_key=request.query_params.get('range','week');days={'day':1,'week':7,'month':30}.get(range_key,7);since=timezone.now()-timedelta(days=days)
    entries=TimeEntry.objects.filter(user=request.user,started_at__gte=since,ended_at__isnull=False).select_related('item','item__category')
    by_category={};total=0
    for e in entries:
        minutes=max(0,(e.ended_at-e.started_at).total_seconds()/60);total+=minutes
        name=e.item.category.name if e.item and e.item.category else 'بدون دسته';by_category[name]=by_category.get(name,0)+minutes
    return Response({'range':range_key,'minutes':round(total),'byCategory':[{'category':k,'minutes':round(v)} for k,v in sorted(by_category.items(),key=lambda p:p[1],reverse=True)]})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_subscribe(request):
    sub=request.data.get('subscription',request.data)
    endpoint=sub.get('endpoint') if isinstance(sub,dict) else None
    keys=sub.get('keys',{}) if isinstance(sub,dict) else {}
    if not endpoint or not isinstance(keys,dict) or not keys.get('p256dh') or not keys.get('auth'):
        return Response({'detail':'اشتراک Push نامعتبر است.'},status=400)
    obj,created=PushSubscription.objects.update_or_create(endpoint=endpoint,defaults={'user':request.user,'keys':keys,'user_agent':request.META.get('HTTP_USER_AGENT','')[:500]})
    return Response({'id':str(obj.id),'created':created},status=201 if created else 200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_unsubscribe(request):
    endpoint=request.data.get('endpoint')
    if endpoint:PushSubscription.objects.filter(user=request.user,endpoint=endpoint).delete()
    return Response({'ok':True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_data(request):
    categories=[category_dict(c) for c in Category.objects.filter(user=request.user)]
    items=[item_dict(i) for i in Item.objects.filter(user=request.user).select_related('category').prefetch_related('attachments')]
    entries=[{'id':str(e.id),'itemId':str(e.item_id) if e.item_id else None,'startedAt':e.started_at.isoformat(),'endedAt':e.ended_at.isoformat() if e.ended_at else None,'source':e.source} for e in TimeEntry.objects.filter(user=request.user)]
    return Response({'app':'RUHA','version':1,'exportedAt':timezone.now().isoformat(),'categories':categories,'items':items,'timeEntries':entries})
