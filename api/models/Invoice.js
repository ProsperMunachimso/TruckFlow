const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({

  // We decided to add an invoive because every business has an invoice and this would make payments easier.
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  
  // The base amount before tax (
  totalAmount: { type: Number, required: true },
  
  // Tax amount 
  tax: { type: Number, default: 0 },
  
  // Final amount including tax
  grandTotal: { type: Number, required: true },
  
  // Whether the invoice has been paid or not 
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  
  // URL link to the generated PDF version of the invoice.
  // We did pdf because it a format people are used to for receipts and invoices.
  pdfUrl: String,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);