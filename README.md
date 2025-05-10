# 🧾 Receiptly

Receiptly is a modern web application that helps you scan and split receipts easily. It uses OCR technology to extract text from receipt images, allows you to edit the extracted data, and provides a simple way to split expenses among multiple people.
## 🚀 Features

    Receipt Scanning: Upload or capture receipt images

    Text Extraction: OCR processing to extract items and prices

    Receipt Editing: Correct any OCR mistakes inline

    Bill Splitting: Add people and attribute items to them

    Split Calculation: Automatically calculate how much each person owes

## ⚙️ How It Works

    Scan a Receipt: Upload an image or take a photo of your receipt

    Review & Edit: Make any corrections to the extracted text and prices

    Add People: Enter the names of everyone splitting the bill

    Assign Items: Select who's paying for what items

    View Results: See a detailed breakdown of how much each person owes

## 🛠 Contributing

First, install the dependencies:

npm install

Then, run the development server:

npm run dev

Open http://localhost:3000 with your browser to see the application.

### 📁 Project Structure

/app            → Next.js app router pages  
/components     → Reusable React components  
/contexts       → Global state management with React Context  
/services       → Business logic organized by domain  
/ocr            → OCR processing services  
/receiptParser  → Receipt parsing logic  
/validation     → Receipt data validation  

### Technologies Used

    Next.js: React framework for the frontend

    Tesseract.js: OCR engine for text extraction

    TypeScript: For type-safe code

    Tailwind CSS: For styling

## ✅ TODO
### 🔧 Bugs

    Fix "Split all items equally" button functionality

    Improve OCR accuracy for different receipt formats

    Handle edge cases in receipt parsing logic

### ✨ Features

    Add checkbox to split each item equally on a per-item basis

    Export results to PDF or via email/message

    Save receipts to history for later reference

    Add receipt categories and tags

    Implement currency selection for international use

    Add custom tip calculation

    Create user accounts to save receipt history

    Implement dark/light theme toggle

    Add receipt analytics (spending patterns, categories)

    Handle different languages with Tesseract

    Send Payment links using Monzo

🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
📄 License

This project is licensed under the MIT License – see the LICENSE file for details.