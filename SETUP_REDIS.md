# 🔴 **SETUP REDIS - REQUIRED FOR EMAIL PROCESSING**

## **Problem**

Redis is NOT running. This is why emails aren't being sent.

**Why Redis is needed:**
- BullMQ (email queue system) requires Redis
- Without Redis, email worker cannot process queued emails
- Emails get stuck in "queued" status forever

---

## **🚀 Quick Fix - Install Redis**

### **Option 1: Install Redis Directly (Recommended)**

```bash
# Install Redis
sudo apt update
sudo apt install redis-server -y

# Start Redis
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

### **Option 2: Use Docker (If you have Docker installed)**

```bash
# Start Redis container
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Verify
docker ps | grep redis
redis-cli ping
```

---

### **Option 3: Use Docker Compose (If you have Docker Compose)**

```bash
# Start only Redis service
docker compose up redis -d

# Verify
redis-cli ping
```

---

## **✅ Verify Redis is Running**

After installation, run:

```bash
# Test connection
redis-cli ping
# Should return: PONG

# Run diagnostic again
./diagnose-email-issues.sh
# Should now show: ✅ Redis is running
```

---

## **🔄 After Starting Redis**

1. **Restart your backend** to reconnect to Redis:
   ```bash
   # Stop backend (Ctrl+C)
   npm run dev
   ```

2. **Check logs** for:
   ```
   Queues and workers initialized
   ```

3. **Process queued emails** - If you had emails stuck in queue:
   ```bash
   # Check queue status
   mongosh rizq_ai --eval "db.emailsendqueues.countDocuments({status: 'queued'})"
   ```
   These should start processing automatically once Redis is running.

---

## **🐛 Troubleshooting**

### **Redis won't start?**

```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo journalctl -u redis-server -n 50

# Try starting manually
sudo redis-server /etc/redis/redis.conf
```

### **Redis connection refused?**

```bash
# Check if Redis is listening
netstat -tuln | grep 6379
# OR
ss -tuln | grep 6379

# Should show: tcp 0.0.0.0:6379
```

### **Permission denied?**

```bash
# Check Redis config
cat /etc/redis/redis.conf | grep bind
# Should allow localhost: bind 127.0.0.1 or bind 0.0.0.0
```

---

## **📊 Expected Behavior After Fix**

Once Redis is running:

1. ✅ Backend logs show: "Queues and workers initialized"
2. ✅ Worker starts processing email queue
3. ✅ Queued emails get processed
4. ✅ Emails are sent via Gmail API
5. ✅ Test inboxes receive emails

---

## **⚡ Quick Command Summary**

```bash
# Install Redis
sudo apt install redis-server -y

# Start Redis
sudo systemctl start redis-server

# Verify
redis-cli ping

# Restart backend
npm run dev

# Run diagnostic
./diagnose-email-issues.sh
```

---

**After Redis is running, your emails will start processing! 🎯**



