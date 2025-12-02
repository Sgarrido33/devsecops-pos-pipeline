FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .

# Instalamos dependencias y Gunicorn (Actualizado para evitar vulnerabilidad Trivy)
# Forzamos versión segura de Gunicorn
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install "gunicorn>=22.0.0"

COPY backend/ .

EXPOSE 5000

# --- CORRECCIÓN DE SEGURIDAD ---
# Creamos un usuario llamado 'appuser' y cambiamos a él
RUN useradd -m appuser
USER appuser
# -------------------------------

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]