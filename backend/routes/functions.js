import express from 'express';

const router = express.Router();

router.post('/validate-role-code', (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ error: 'Code is required' });

  // Basic mock mapping for Shivohini Hub roles
  const mockRoles = {
    'ADMIN2025': 'admin',
    'PM2025': 'project_manager',
    'TL2025': 'team_leader',
    'TM2025': 'team_member'
  };

  const role = mockRoles[code.toUpperCase()];
  if (role) {
    res.json({ valid: true, role });
  } else {
    // If it's something else, fall back to testing
    if (code === 'TEST') {
      res.json({ valid: true, role: 'team_member' });
    } else {
      res.json({ error: 'Invalid role code' });
    }
  }
});

export default router;
