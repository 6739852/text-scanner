# 📦 Contract Number Scanner - OCR Label Reader

Welcome to this open-source project designed to help offices scan return-mail labels and extract **contract numbers** directly from camera images!

## 🎯 Project Goal
This app allows you to scan postal labels using a camera (mobile/desktop) and automatically detect a **7-digit contract number**, located next to the city name on the **third line** of the label.

## ✨ Features
- Uses the back camera by default on mobile
- Real-time image scanning with `Tesseract.js` (OCR)
- Automatically detects 7-digit contract numbers
- Stores extracted numbers in a visible list
- Export all results to an Excel file
- Clean, responsive UI using MUI (Material-UI)

## 🚀 How It Works
1. Open the app in a browser with camera access
2. Click the **📸 Scan** button
3. The image is processed using OCR
4. If a valid contract number is found – it's added to the list
5. You can export the full list to an Excel file at any time

## 🧱 Tech Stack
- React + Vite
- Tesseract.js (OCR engine)
- Material-UI (for styling)
- xlsx + FileSaver for exporting Excel files
- GitHub Pages for free hosting

## 🌍 Live App
[Click here to open the app](https://6739852.github.io/text-scanner)

## 👩‍💻 Author
Built with love for internal office use ❤️
Feel free to use, improve, and share!

## 📄 Credits

This project uses [Tesseract.js](https://github.com/naptha/tesseract.js), a pure JavaScript OCR library based on the open-source [Tesseract OCR Engine](https://github.com/tesseract-ocr/tesseract) maintained by Google.  
Tesseract is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).


