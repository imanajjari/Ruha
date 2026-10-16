import json
import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.core.models import Reminder, PushSubscription

class Command(BaseCommand):
    help = 'Send due Web Push reminders. Run periodically from cron/systemd; VAPID credentials are required.'
    def handle(self, *args, **options):
        public_key=os.getenv('VAPID_PUBLIC_KEY','')
        private_key=os.getenv('VAPID_PRIVATE_KEY','')
        subject=os.getenv('VAPID_CLAIMS_SUBJECT','mailto:admin@example.com')
        if not public_key or not private_key:
            self.stderr.write(self.style.ERROR('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured.'))
            return
        try:
            from pywebpush import webpush, WebPushException
        except ImportError:
            self.stderr.write(self.style.ERROR('Install pywebpush first.'))
            return
        reminders=Reminder.objects.filter(sent_at__isnull=True,remind_at__lte=timezone.now(),item__deleted_at__isnull=True).select_related('item','user')[:200]
        sent=failed=0
        for reminder in reminders:
            subs=PushSubscription.objects.filter(user=reminder.user)
            if not subs.exists():
                reminder.last_error='No active Push subscription'; reminder.attempts += 1; reminder.save(update_fields=['last_error','attempts']); continue
            payload=json.dumps({'title':'یادآور RUHA','body':reminder.item.title,'itemId':str(reminder.item_id),'tag':f'ruha-{reminder.item_id}'},ensure_ascii=False)
            success=False
            for sub in subs:
                try:
                    webpush(subscription_info={'endpoint':sub.endpoint,'keys':sub.keys},data=payload,vapid_private_key=private_key,vapid_claims={'sub':subject},ttl=3600)
                    success=True
                except WebPushException as exc:
                    failed+=1
                    code=getattr(getattr(exc,'response',None),'status_code',None)
                    if code in (404,410): sub.delete()
                    else: self.stderr.write(f'Push failed for subscription {sub.pk}: {exc}')
            reminder.attempts += 1
            if success:
                reminder.sent_at=timezone.now();reminder.last_error='';sent+=1
            else:
                reminder.last_error='Push delivery failed'
            reminder.save(update_fields=['sent_at','attempts','last_error'])
        self.stdout.write(self.style.SUCCESS(f'Finished reminders: sent={sent}, failed={failed}'))
