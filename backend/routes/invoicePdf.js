import express from "express";
import multer from "multer";
import path from "path";
import pool from "../db.js";

const router = express.Router();

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/invoices/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 🔥 UPLOAD PDF
router.post("/:invoiceId", upload.single("pdf"), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/storage/v1/object/public/invoices/${req.file.filename}`;

    await pool.query(
      `UPDATE invoices SET pdf_url = $1 WHERE id = $2`,
      [fileUrl, invoiceId]
    );

    res.json({
      success: true,
      pdfUrl: fileUrl,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;