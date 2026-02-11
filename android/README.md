# StableFlow Android App

Aplikasi Android native untuk StableFlow - sistem manajemen keuangan USDC premium dengan integrasi Solana.

## 📱 Fitur Lengkap

### Autentikasi & Profil
- ✅ Login dengan email/password via Firebase
- ✅ Registrasi akun baru
- ✅ Profil pengguna dengan avatar
- ✅ Pengaturan wallet address

### Dashboard
- ✅ Tampilan saldo USDC real-time
- ✅ Statistik klaim (pending, approved, paid, rejected)
- ✅ Daftar expense claims dengan status
- ✅ Pull-to-refresh untuk update data
- ✅ Bottom navigation

### Expense Management
- ✅ Submit expense claim baru
- ✅ Upload foto struk dengan camera/gallery
- ✅ Lokasi GPS otomatis
- ✅ Pilih kategori pengeluaran
- ✅ Detail expense dengan status tracking
- ✅ Cancel pending claims

### Solana Integration
- ✅ **SolanaClient** - RPC calls untuk balance checking
- ✅ **SolanaManager** - Wallet operations manager
- ✅ Check SOL & USDC balances dari blockchain
- ✅ Transaction verification
- ✅ Deep link ke Solana Explorer / Solscan
- ✅ Solana Pay URL generation
- ✅ Phantom wallet integration (deep link)

### Analytics
- ✅ Statistik expense per status
- ✅ Total nilai klaim
- ✅ Breakdown status detail

### Settings
- ✅ Edit profil
- ✅ Kelola wallet address Solana
- ✅ Logout

## 🏗️ Struktur Project

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/stableflow/app/
│   │   │   ├── StableFlowApp.java              # Application class
│   │   │   ├── data/
│   │   │   │   ├── model/
│   │   │   │   │   ├── ExpenseRequest.java     # Model klaim
│   │   │   │   │   └── User.java               # Model user
│   │   │   │   ├── repository/
│   │   │   │   │   └── FirebaseRepository.java # Firebase operations
│   │   │   │   └── solana/
│   │   │   │       ├── SolanaClient.java       # RPC client
│   │   │   │       └── SolanaManager.java      # Wallet manager
│   │   │   └── ui/
│   │   │       ├── SplashActivity.java
│   │   │       ├── auth/
│   │   │       │   ├── LoginActivity.java
│   │   │       │   └── LoginViewModel.java
│   │   │       ├── dashboard/
│   │   │       │   ├── DashboardActivity.java
│   │   │       │   ├── DashboardViewModel.java
│   │   │       │   └── ExpenseAdapter.java
│   │   │       ├── expense/
│   │   │       │   ├── SubmitExpenseActivity.java
│   │   │       │   ├── SubmitExpenseViewModel.java
│   │   │       │   └── ExpenseDetailActivity.java
│   │   │       ├── analytics/
│   │   │       │   ├── AnalyticsActivity.java
│   │   │       │   └── AnalyticsViewModel.java
│   │   │       ├── settings/
│   │   │       │   ├── SettingsActivity.java
│   │   │       │   └── SettingsViewModel.java
│   │   │       └── wallet/
│   │   │           └── WalletActivity.java
│   │   ├── res/
│   │   │   ├── layout/                         # 10+ XML layouts
│   │   │   ├── drawable/                       # 50+ icons & backgrounds
│   │   │   ├── values/                         # Colors, strings, themes
│   │   │   ├── menu/                           # Navigation menus
│   │   │   └── xml/                            # Config files
│   │   └── AndroidManifest.xml
│   ├── build.gradle
│   ├── google-services.json                    # Firebase config
│   └── proguard-rules.pro
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## 🚀 Setup

### Prerequisites

1. **Android Studio** - Arctic Fox atau lebih baru
2. **JDK 17** atau lebih baru
3. **Firebase Project** dengan:
   - Authentication (Email/Password)
   - Realtime Database
   - Storage

### Langkah Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd StableFlow/android
   ```

2. **Setup Firebase**
   - Buat project di [Firebase Console](https://console.firebase.google.com)
   - Enable Email/Password Authentication
   - Setup Realtime Database dengan rules berikut:
     ```json
     {
       "rules": {
         "users": {
           "$uid": {
             ".read": "$uid === auth.uid",
             ".write": "$uid === auth.uid"
           }
         },
         "expenses": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
     ```
   - Download `google-services.json` dan letakkan di `app/`

3. **Google Maps API (Opsional)**
   - Dapatkan API key dari [Google Cloud Console](https://console.cloud.google.com)
   - Ganti `YOUR_GOOGLE_MAPS_API_KEY` di `AndroidManifest.xml`

4. **Build & Run**
   ```bash
   ./gradlew assembleDebug
   ```
   Atau buka project di Android Studio dan klik Run.

## 🔗 Solana Integration Details

### SolanaClient
RPC client untuk berkomunikasi dengan Solana blockchain:
- `getSolBalance()` - Mendapatkan saldo SOL
- `getUsdcBalance()` - Mendapatkan saldo USDC
- `getBalances()` - Mendapatkan kedua saldo
- `isTransactionConfirmed()` - Cek status konfirmasi transaksi
- `getExplorerUrl()` - Generate URL Solana Explorer

### SolanaManager
Singleton manager untuk operasi wallet:
- Balance tracking dengan LiveData
- Sync balance ke Firebase
- Deep link ke Phantom wallet
- Solana Pay URL generation

### Network Configuration
Default menggunakan **Devnet** untuk development. Untuk production:
```java
// Di SolanaManager.java
client = new SolanaClient(false); // false = Mainnet
```

### USDC Token Addresses
- **Mainnet**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Devnet**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

## 🎨 Design System

### Colors
| Color | Value | Usage |
|-------|-------|-------|
| Navy Primary | #0A1628 | Background utama |
| Navy Secondary | #142038 | Card background |
| Gold Primary | #D4A940 | Aksen, CTA buttons |
| Gold Secondary | #F5D77E | Highlights |
| Success Green | #22C55E | Status approved/paid |
| Warning Yellow | #EAB308 | Status pending |
| Error Red | #EF4444 | Status rejected |

### Typography
- Headlines: Bold, White
- Body: Regular, #94A3B8
- Caption: Light, #64748B

## 📦 Dependencies

```groovy
// Firebase BOM
implementation platform('com.google.firebase:firebase-bom:32.7.0')
implementation 'com.google.firebase:firebase-auth'
implementation 'com.google.firebase:firebase-database'
implementation 'com.google.firebase:firebase-storage'

// AndroidX Lifecycle
implementation 'androidx.lifecycle:lifecycle-viewmodel:2.7.0'
implementation 'androidx.lifecycle:lifecycle-livedata:2.7.0'

// Material Design
implementation 'com.google.android.material:material:1.11.0'

// Image Loading
implementation 'com.github.bumptech.glide:glide:4.16.0'

// Location
implementation 'com.google.android.gms:play-services-location:21.1.0'

// SwipeRefreshLayout
implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
```

## 🔧 Build Variants

- **Debug**: Development build dengan logging
- **Release**: Production build dengan ProGuard minification

## 📋 Checklist Sebelum Release

- [ ] Ganti `google-services.json` dengan production config
- [ ] Update `SolanaClient` ke Mainnet
- [ ] Set Google Maps API key
- [ ] Test semua fitur
- [ ] Generate signed APK/Bundle

## 📄 License

Copyright © 2024 StableFlow. All rights reserved.
