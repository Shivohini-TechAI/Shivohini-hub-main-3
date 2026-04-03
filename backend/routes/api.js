import express from 'express';
import { query } from '../db.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Helper to handle standard Supabase-like CRUD
const getColumns = (req) => {
  const selectQuery = req.query.select || '*';
  return selectQuery === '*' ? '*' : selectQuery.split(',').map(c => `"${c.trim()}"`).join(', ');
};

// GET /rest/v1/:table
router.get('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  const cols = getColumns(req);
  
  // Basic security mappings mapping tables to user_id fields
  const userCheckFields = {
    'projects': 'created_by',
    'tasks': 'created_by', // Might need to check assignee
    'user_profiles': 'id',
    'project_members': 'user_id',
    // We will expand these rules as we refine the backend
  };

  try {
    let sql = `SELECT ${cols} FROM public."${table}" WHERE 1=1`;
    let params = [];
    
    // Parse ?col=eq.val
    for (const [key, val] of Object.entries(req.query)) {
      if (key === 'select') continue;
      
      const vStr = String(val);
      if (vStr.startsWith('eq.')) {
        params.push(vStr.replace('eq.', ''));
        sql += ` AND "${key}" = $${params.length}`;
      } else if (vStr.startsWith('in.')) {
        const inVals = vStr.replace('in.(', '').replace(')', '').split(',');
        params.push(inVals);
        sql += ` AND "${key}" = ANY($${params.length})`;
      } else {
        params.push(vStr);
        sql += ` AND "${key}" = $${params.length}`;
      }
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  const data = Array.isArray(req.body) ? req.body : [req.body];
  
  if (data.length === 0) return res.json([]);

  try {
    const keys = Object.keys(data[0]);
    const cols = keys.map(k => `"${k}"`).join(', ');
    
    let params = [];
    const valuesStrings = data.map((row, i) => {
      const vals = keys.map((k, j) => {
        params.push(row[k]);
        return `$${params.length}`;
      });
      return `(${vals.join(', ')})`;
    });

    const sql = `INSERT INTO public."${table}" (${cols}) VALUES ${valuesStrings.join(', ')} RETURNING *`;
    const result = await query(sql, params);
    
    res.json(result.rows);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update & Delete follow similarly, we rely on standard Eq parsers
router.patch('/:table', requireAuth, async (req, res) => { 
  res.status(501).json({ error: 'Not implemented yet' });
});
// ... expanding in full implementation

export default router;
