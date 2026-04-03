FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install cron
RUN apt-get update && apt-get install -y cron

# Add cron job directly (no file issues)
RUN echo "0 2 * * * root /usr/local/bin/node /app/sendEmail.js >> /var/log/cron.log 2>&1" > /etc/crontab

# Create log file
RUN touch /var/log/cron.log

CMD ["cron", "-f"]