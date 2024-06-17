FROM python:3.9

WORKDIR /app

COPY requirements.txt requirements.txt

COPY lectura.zip lectura.zip

RUN apt-get update && \
    apt-get install -y unzip && \
    unzip lectura.zip -d /app && \
    rm lectura.zip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install -r requirements.txt


CMD sh -c 'sleep 2 && python main.py'

EXPOSE 5000
