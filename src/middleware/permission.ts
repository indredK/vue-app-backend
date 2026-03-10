import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const checkPermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { query } = await import('../db');
      const result = await query(
        'SELECT permissions FROM roles WHERE id = $1',
        [req.user.roleId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Role not found' });
      }

      const permissions = result.rows[0].permissions;
      
      if (permissions.includes('*') || permissions.includes(requiredPermission)) {
        next();
      } else {
        res.status(403).json({ error: 'Permission denied' });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.roleId !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
