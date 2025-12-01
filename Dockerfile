# Usamos una imagen ligera de Python
FROM python:3.10-slim

# Establecemos el directorio de trabajo DENTRO del contenedor
WORKDIR /app

# 1. Copiamos los requirements desde la carpeta 'backend'
# ANTES: COPY app/requirements.txt .
# AHORA:
COPY backend/requirements.txt .

# 2. Instalamos dependencias
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn  # Aseguramos que gunicorn esté instalado para producción

# 3. Copiamos el resto del código desde la carpeta 'backend'
# ANTES: COPY app/ .
# AHORA:
COPY backend/ .

# Exponemos el puerto
EXPOSE 5000

# Comando por defecto (Usamos Gunicorn como vimos en la entrega 2)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]