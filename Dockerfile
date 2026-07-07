# Use official Python 3.11 slim image as the base
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies (useful if any python packages require compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend codebase
COPY . .

# Expose the default port (Render will override this via $PORT if needed)
EXPOSE 8000

# Start the FastAPI application via Uvicorn
# Using the shell form so that it can dynamically pick up $PORT from cloud providers like Render
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
