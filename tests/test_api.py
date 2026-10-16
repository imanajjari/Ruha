from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from apps.core.models import Category, Item

User = get_user_model()

class ItemApiSecurityTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='one@example.test', email='one@example.test', password='A-safe-passphrase-2026!')
        self.other = User.objects.create_user(username='two@example.test', email='two@example.test', password='Another-safe-passphrase-2026!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_user_can_create_and_list_own_item(self):
        response = self.client.post('/api/v1/items', {'title':'مطالعه','type':'task','priority':'high'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'مطالعه')
        listing = self.client.get('/api/v1/items')
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(len(listing.data), 1)

    def test_user_cannot_read_another_users_item(self):
        foreign = Item.objects.create(user=self.other, title='private item')
        response = self.client.get(f'/api/v1/items/{foreign.id}')
        self.assertEqual(response.status_code, 404)

    def test_category_is_scoped_to_current_user(self):
        foreign_category = Category.objects.create(user=self.other, name='private category')
        response = self.client.post('/api/v1/items', {'title':'test','categoryId':str(foreign_category.id)}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_upload_checks_file_signature(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        item = Item.objects.create(user=self.user, title='photo')
        bad = SimpleUploadedFile('fake.png', b'not really a png', content_type='image/png')
        response = self.client.post(f'/api/v1/items/{item.id}/attachments', {'file':bad}, format='multipart')
        self.assertEqual(response.status_code, 400)
