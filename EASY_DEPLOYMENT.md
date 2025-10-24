# 🚀 Easy Deployment Guide (Render + Vercel)
## FREE for 5-10 users | Setup time: 20 minutes

---

## Overview
- **Backend**: Render.com (Free tier)
- **Frontend**: Vercel (Free tier)  
- **Database**: Firebase Firestore (Free tier)

**Total Cost: $0/month** for your usage!

---

## Part 1: Prepare Your Code

### 1. Push to GitHub (if not already)

```bash
cd /home/gb/Desktop/NAVEventProject/CollegeConnect

# Initialize git if needed
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Part 2: Deploy Backend (Render.com)

### 1. Sign up for Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (it's free!)

### 2. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select `CollegeConnect` repository

### 3. Configure Build Settings
```
Name: collegeconnect-backend
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Docker
```

### 4. Build Command
```
mvn clean package -DskipTests
```

### 5. Start Command
```
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### 6. Environment Variables
Click "Advanced" and add:
```
FIRESTORE_PROJECT_ID=studio-6560732135-c4764
PORT=8081
```

### 7. Select Free Plan
- Instance Type: **Free**
- Click **"Create Web Service"**

### 8. Get Your Backend URL
After deployment, copy the URL (looks like: `https://collegeconnect-backend.onrender.com`)

⚠️ **Note**: Free Render services sleep after 15 min of inactivity. First request after sleep takes ~30s to wake up.

---

## Part 3: Setup Firebase Service Account

### 1. Download Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `studio-6560732135-c4764`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Save the JSON file

### 2. Add to Render
1. In Render dashboard, go to your service
2. Go to **Environment** tab
3. Click **"Add Secret File"**
4. Name: `GOOGLE_APPLICATION_CREDENTIALS`
5. Path: `/etc/secrets/firebase-key.json`
6. Paste the entire JSON content
7. Click **"Save"**

---

## Part 4: Deploy Frontend (Vercel)

### 1. Sign up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (it's free!)

### 2. Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your `CollegeConnect` repository
3. Vercel will auto-detect Next.js

### 3. Configure Build Settings
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 4. Environment Variables
Add this variable:
```
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://collegeconnect-backend.onrender.com
```

### 5. Deploy
Click **"Deploy"** and wait ~2 minutes

### 6. Get Your Frontend URL
Copy the URL (looks like: `https://college-connect-xyz.vercel.app`)

---

## Part 5: Final Configuration

### 1. Update Firebase Authorized Domains
1. Go to Firebase Console → **Authentication** → **Settings**
2. Click **"Authorized domains"**
3. Add your Vercel domain: `college-connect-xyz.vercel.app`

### 2. Test Your App!
1. Open your Vercel URL
2. Try logging in
3. Create an event
4. Test navigation

---

## Part 6: Custom Domain (Optional)

### If you have a domain:

**For Frontend (Vercel)**:
1. Vercel dashboard → **Settings** → **Domains**
2. Add your domain: `yourdomain.com`
3. Update your DNS records as shown

**For Backend (Render)**:
1. Render dashboard → **Settings** → **Custom Domains**
2. Add: `api.yourdomain.com`
3. Update your DNS CNAME record

Then update `NEXT_PUBLIC_BACKEND_URL` in Vercel to `https://api.yourdomain.com`

---

## Monitoring & Logs

### Render (Backend):
- Dashboard → Your Service → **Logs** tab
- Real-time logs of your backend

### Vercel (Frontend):
- Dashboard → Your Project → **Logs** tab
- See all requests and errors

### Firebase (Database):
- Console → **Firestore** → **Usage** tab
- Monitor read/write operations

---

## Free Tier Limits

| Service | Free Tier Limit | Your Usage (estimate) |
|---------|----------------|---------------------|
| Render | 750 hours/month | ~720 hours/month ✅ |
| Vercel | 100GB bandwidth | ~5GB/month ✅ |
| Firestore | 50K reads/day | ~200 reads/day ✅ |
| Firebase Auth | Unlimited | ✅ |

You're well within all limits! 🎉

---

## Important Notes

### Render Free Tier:
- ✅ Enough for 5-10 users
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ First request after sleep: ~30s delay
- 💡 Keep-alive solution: Use [UptimeRobot](https://uptimerobot.com) to ping your backend every 5 min (free)

### If You Outgrow Free Tier:
Render paid plan starts at $7/month (always-on, no sleep)

---

## Troubleshooting

### Backend not working:
1. Check Render logs
2. Verify Firebase credentials uploaded
3. Check environment variables

### Frontend can't reach backend:
1. Verify `NEXT_PUBLIC_BACKEND_URL` is correct
2. Check Render service is running
3. Test backend directly: `curl https://your-backend.onrender.com/api/events`

### First request very slow:
This is normal for Render free tier (waking up from sleep)

---

## Total Setup Time: ~20 minutes

1. **Render setup**: 10 min
2. **Vercel setup**: 5 min  
3. **Firebase config**: 5 min

---

## Next Steps

1. Follow this guide step by step
2. Test thoroughly
3. Share with your 5-10 users!
4. Monitor usage in dashboards

**Cost: $0/month** for your usage! 🎉
