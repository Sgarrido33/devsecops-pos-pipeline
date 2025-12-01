# Imagen base
FROM python:3.11-slim

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto de la app
COPY app/ .

# Exponemos el puerto 5000
EXPOSE 5000

# Comando para ejecutar el servidor
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
