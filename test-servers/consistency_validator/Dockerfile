FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY consistency_validator.py .

RUN mkdir -p /metrics

CMD ["python", "consistency_validator.py"]