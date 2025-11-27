FROM python:3.11-slim

# System deps for OpenCV headless
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY backend/ /app/

ENV PORT=8421
EXPOSE 8421

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8421"]

