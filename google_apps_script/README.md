# 🚀 AppXwinD ERP - Google Sheets Live Auto-Sync Guide

Iss Apps Script se aapka Google Sheet seedha aapke **Student Management System ERP Backend** se connect ho jayega!
Aapko har baar manual import/export **nahi** karna padega. Ek click par Google Sheet ke saare tabs (Executive Summary, Students, Admissions Log, Courses) auto-fill aur format ho jayenge!

---

## 🛠️ Step-by-Step Setup Guide (2 Minutes)

### Step 1: Open Google Sheets
1. Naya Google Sheet kholein (ya apna existing Google Sheet open karein).

### Step 2: Open Apps Script Editor
1. Top Menu bar par **Extensions** > **Apps Script** par click karein.
2. Apps Script editor screen khulegi.

### Step 3: Copy & Paste `Code.gs`
1. Existing `myFunction()` text ko select karke delete kar dein.
2. File [Code.gs](file:///d:/student-management-system/google_apps_script/Code.gs) ka pura code copy karein aur Apps Script editor mein paste kar dein.
3. Top bar mein **Save** button (💾 Icon ya `Ctrl + S`) press karein.

### Step 4: Run Initial Permission Grant
1. Editor ke top dropdown mein `onOpen` select karein aur **Run** (▶) button click karein.
2. Google permission dialog pop-up aayega:
   - **Review permissions** -> Select your Google Account.
   - Click **Advanced** -> Click **Go to Untitled project (unsafe)** -> Click **Allow**.

### Step 5: Start Using Live Sync in Google Sheets!
1. Wapass apne Google Sheet tab par jayein aur page refresh (`F5`) karein.
2. Top menu bar mein ek Naya Menu dikhega: **`🚀 AppXwinD ERP Sync`**!

---

## 🎮 Features Included in Custom Menu

- **`🔄 Sync All Sheets Now`**: Single click par 4 custom formatted sheets generate aur update karta hai:
  1. 📊 **Executive Summary**: Total unique students, financial metrics, collection rate %.
  2. 👥 **Students Directory**: Sabhi unique physical students ki master list with mobile, email, status, and pending dues.
  3. 📜 **Admissions Log**: Full course admissions log with original fees, discounts, final fees, paid, pending.
  4. 🎓 **Courses Overview**: Course-wise total enrolled, active, and completed students.
- **`⏰ Enable Hourly Auto-Sync`**: Activate karne par Google Sheets har 1 ghante mein piche se automatic background update karega!
