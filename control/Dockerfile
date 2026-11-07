FROM python:3.12-slim
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
RUN playwright install --with-deps chromium
COPY latch /app/latch
WORKDIR /app
CMD ["uvicorn", "latch.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
