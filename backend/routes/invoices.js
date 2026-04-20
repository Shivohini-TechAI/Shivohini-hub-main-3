import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * =========================
 * CREATE / UPDATE INVOICE
 * =========================
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const data = req.body;

    const {
      invoiceId,
      number,
      issueDate,
      dueDate,
      currency,
      billFrom,
      billTo,
      lineItems,
      taxRate,
      discountType,
      discountValue,
      includeNotes,
      notes,
      includeTerms,
      terms,
      includeSignature,
      signatureUrl,
      createdBy,
      calculations
    } = data;

    await client.query('BEGIN');

    // 🔥 FIX: only reuse invoiceId if explicitly provided AND exists in DB
    // Otherwise always create a new invoice
    let invoice_id = null;

    if (invoiceId) {
      // Check if this invoice actually exists
      const existing = await client.query(
        `SELECT id FROM invoices WHERE id = $1 AND created_by = $2`,
        [invoiceId, createdBy]
      );

      if (existing.rows.length > 0) {
        // Exists — update it
        invoice_id = invoiceId;
      }
    }

    // If no valid existing invoice found, create new
    if (!invoice_id) {
      invoice_id = uuidv4();
    }

    // Check if we're inserting or updating
    const exists = await client.query(
      `SELECT id FROM invoices WHERE id = $1`,
      [invoice_id]
    );

    if (exists.rows.length > 0) {
      // ================= UPDATE =================
      await client.query(
        `UPDATE invoices SET
          number = $1,
          issue_date = $2,
          due_date = $3,
          currency = $4,
          bill_from_company = $5,
          bill_from_email = $6,
          bill_from_phone = $7,
          bill_from_address = $8,
          bill_to_name = $9,
          bill_to_email = $10,
          bill_to_phone = $11,
          bill_to_address = $12,
          tax_rate = $13,
          discount_type = $14,
          discount_value = $15,
          subtotal = $16,
          tax_amount = $17,
          discount_amount = $18,
          total_due = $19,
          include_notes = $20,
          notes = $21,
          include_terms = $22,
          terms = $23,
          include_signature = $24,
          signature_url = $25,
          updated_at = NOW()
        WHERE id = $26`,
        [
          number,
          issueDate,
          dueDate,
          currency,
          billFrom.company,
          billFrom.email,
          billFrom.phone,
          billFrom.address,
          billTo.name,
          billTo.email,
          billTo.phone,
          billTo.address,
          taxRate,
          discountType || null,
          discountValue,
          calculations.subtotal,
          calculations.taxAmount,
          calculations.discountAmount,
          calculations.totalDue,
          includeNotes,
          notes,
          includeTerms,
          terms,
          includeSignature,
          signatureUrl,
          invoice_id
        ]
      );
    } else {
      // ================= INSERT =================
      await client.query(
        `INSERT INTO invoices (
          id, number, issue_date, due_date, currency,
          bill_from_company, bill_from_email, bill_from_phone, bill_from_address,
          bill_to_name, bill_to_email, bill_to_phone, bill_to_address,
          tax_rate, discount_type, discount_value,
          subtotal, tax_amount, discount_amount, total_due,
          include_notes, notes,
          include_terms, terms,
          include_signature, signature_url,
          created_by, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,$11,$12,$13,
          $14,$15,$16,
          $17,$18,$19,$20,
          $21,$22,
          $23,$24,
          $25,$26,
          $27, NOW(), NOW()
        )`,
        [
          invoice_id,
          number,
          issueDate,
          dueDate,
          currency,
          billFrom.company,
          billFrom.email,
          billFrom.phone,
          billFrom.address,
          billTo.name,
          billTo.email,
          billTo.phone,
          billTo.address,
          taxRate,
          discountType || null,
          discountValue,
          calculations.subtotal,
          calculations.taxAmount,
          calculations.discountAmount,
          calculations.totalDue,
          includeNotes,
          notes,
          includeTerms,
          terms,
          includeSignature,
          signatureUrl,
          createdBy
        ]
      );
    }

    // Delete and re-insert line items
    await client.query(
      `DELETE FROM invoice_line_items WHERE invoice_id = $1`,
      [invoice_id]
    );

    for (const item of lineItems) {
      await client.query(
        `INSERT INTO invoice_line_items (
          id, invoice_id, name, description, qty, unit_price, line_total
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          uuidv4(),
          invoice_id,
          item.name,
          item.description || '',
          item.qty,
          item.unitPrice,
          item.qty * item.unitPrice
        ]
      );
    }

    await client.query('COMMIT');

    res.json({ success: true, invoiceId: invoice_id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Save failed' });
  } finally {
    client.release();
  }
});

/**
 * =========================
 * GET ALL INVOICES
 * =========================
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const result = await pool.query(
      `SELECT id, number, bill_to_name, issue_date, due_date, currency, total_due, created_at
       FROM invoices
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

/**
 * =========================
 * GET SINGLE INVOICE
 * =========================
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const invoiceRes = await pool.query(
      `SELECT * FROM invoices WHERE id = $1 AND created_by = $2`,
      [id, userId]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const items = await pool.query(
      `SELECT * FROM invoice_line_items WHERE invoice_id = $1`,
      [id]
    );

    res.json({
      ...invoiceRes.rows[0],
      lineItems: items.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

export default router;