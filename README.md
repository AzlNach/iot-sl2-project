# IoT Sensor Dashboard

A real-time IoT sensor monitoring dashboard built with Next.js 14, Tailwind CSS, and Firebase Realtime Database.

## 🚀 Features

- **Real-time Data**: Live sensor data updates using Firebase Realtime Database
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Visual Indicators**: Color-coded cards based on sensor values
  - 🔴 Red: High temperature (≥35°C)
  - 🟡 Yellow/Orange: Warm temperature (28-35°C)
  - 🟢 Green: Normal temperature (20-28°C)
  - 🔵 Blue: Cool temperature (<20°C)
- **Status Monitoring**: Real-time system status display
- **Alert System**: Visual alerts when temperature exceeds threshold

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase account with Realtime Database enabled

## 🛠️ Installation

1. **Clone or navigate to the project**
   ```bash
   cd iot-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Firebase credentials in `.env.local`**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAXJcJYhMmS81mqPoFk6I-IruhDlKv_OnQ
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=iot-sl2.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://iot-sl2-default-rtdb.asia-southeast1.firebasedatabase.app
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=iot-sl2
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=iot-sl2.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1015059017204
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1015059017204:web:76a9ead7baa921e5521da1
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-N3SD0FLE9V
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the dashboard**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Firebase Data Structure

The dashboard expects data at the `sensors/` path in your Firebase Realtime Database with the following structure:

```json
{
  "sensors": {
    "temperature": 30,
    "humidity": 80,
    "status": "active"
  }
}
```

### Setting up Firebase Realtime Database Rules

For development, you can use these rules (⚠️ NOT recommended for production):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, use more restrictive rules based on your authentication requirements.

## 📁 Project Structure

```
iot-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── firebase/
│   │   └── config.ts         # Firebase configuration
│   └── hooks/
│       └── useSensorData.ts  # Custom hook for real-time data
├── .env.example              # Environment variables template
├── .env.local                # Your local environment variables (git-ignored)
├── package.json
├── tailwind.config.ts
└── README.md
```

## 🚀 Deploying to Vercel

### Method 1: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables in Vercel Dashboard**
   - Go to your project settings on [vercel.com](https://vercel.com)
   - Navigate to **Settings** > **Environment Variables**
   - Add all the `NEXT_PUBLIC_FIREBASE_*` variables

### Method 2: GitHub Integration (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/iot-dashboard.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure environment variables before deploying
   - Click **Deploy**

### Environment Variables on Vercel

Add these environment variables in your Vercel project settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | https://your-project-default-rtdb.firebasedatabase.app |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your-project-id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Your Measurement ID |

## 🔧 Customization

### Adding New Sensors

1. Update the `SensorData` interface in `src/hooks/useSensorData.ts`:
   ```typescript
   export interface SensorData {
     temperature: number;
     humidity: number;
     status: string;
     pressure?: number;  // Add new sensor
   }
   ```

2. Add a new sensor card in `src/app/page.tsx`

### Changing the Firebase Path

Modify the path in the `useSensorData` hook:
```typescript
const { data, loading, error } = useSensorData("your/custom/path");
```

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
