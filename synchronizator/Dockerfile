FROM python:3.13-alpine

WORKDIR /app

COPY . .
RUN pip install -r requirements.txt
ENV PRODUCTION=true
ENV SERVER_USERNAME=admin
ENV SERVER_PASSWORD=namid
CMD ["python", "-u", "main.py"]
