# Softwood Fabric Library — Quick User Guide

Welcome to the **Softwood Fabric Library**! This web application is designed to help our team and buyers quickly access garment specifications, fabric details, and pricing at fair events or in the showroom. 

Below is a simple guide on how to navigate, scan, search, and generate QR stickers.

---

## 📱 1. Viewing & Scanning Garments (Buyer View)

The default view of the app is the **Buyer View**. It is clean, public-friendly, and hides internal information like pricing and private notes.

### How to scan a QR Code:
1. Open the website on your tablet, phone, or computer.
2. Under the logo, select the **Scan QR** tab.
3. Tap **Start Scanning** and allow the app to access your device's camera.
4. Point your camera at a garment's QR code sticker. 
5. The app will immediately read the code and open a card displaying all fabric specifications (composition, weight, shrinkage, washes, etc.).

### How to search manually:
If you are on a desktop computer or don't have a camera:
1. Select the **Search** tab.
2. Start typing a **Style Ref** (e.g., `REF-0008`), **Composition**, **Color**, or **Style Name**.
3. Click on the style card in the results to view the full details.

---

## 🔒 2. Unlocking the Team View (Internal Pricing)

For Softwood staff, you can unlock private details like **Fabric Price**, internal **Notes**, and **Events** directly from the website.

### How to unlock:
1. Tap or click on the **Softwood logo** in the header **three (3) times quickly**.
2. A password prompt will appear.
3. Enter your secret **Team PIN** (e.g., `1234`) and click **Unlock**.
4. You will see a green **"Team View"** badge appear in the header. The app will now show the pricing and internal notes on all garment detail cards.

> 💡 **Tip:** To lock the view again and return to the public Buyer View, just click the **"Team View"** badge in the header.

---

## 🖨️ 3. Generating & Printing QR Stickers (A4 Sheet)

When you are logged into **Team View**, a **"QR Generator"** option will appear in the top-right menu. This page lets you print sheets of barcode stickers to paste onto your garment cards.

### How to generate stickers:
1. Go to the **QR Generator** page.
2. In the input box, enter the **Sr# (Serial Number)** of the garments you want to print. You can write:
   * **Individual numbers:** `1,4,5,6` (prints exactly those garments)
   * **Ranges:** `1:8` (prints garments 1 through 8)
   * **Open ranges:** `10:` (prints the next 8 garments starting from #10)
3. Click **Generate**. You will see a preview grid of your QR codes.

### Printing setup (Crucial for perfect alignment):
1. Click **Print Now**. This opens your browser's print preview dialog.
2. Change your print settings to:
   * **Paper Size:** A4
   * **Layout:** Portrait
   * **Margins:** Select **Default** or **None** (do not use "minimum")
   * **Headers and Footers:** **Uncheck/Disable** (this removes the website URL and date from printing on the pages)
   * **Background Graphics:** **Check/Enable**
3. Click **Print**. The app is pre-coded to fit exactly **8 stickers per page** beautifully.

---

## 📊 4. Updating the Garment Catalog

You do **not** need to touch code or deploy the app to update the styles. The entire system is linked directly to your **Google Sheet**.

* **To add/edit garments:** Open your Google Sheet, select the **Database** tab, and edit/add rows.
* **Update time:** The app automatically updates with your new sheet data within **60 seconds** (Next.js automatically handles caching to ensure fast performance during fair days).

---

*Thank you for using the Softwood Fabric Library! If you run into any issues, contact your system administrator.*
