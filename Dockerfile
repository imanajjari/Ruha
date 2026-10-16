FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt
COPY . /app
RUN python manage.py makemigrations core --noinput
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["/bin/sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
