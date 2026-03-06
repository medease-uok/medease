const db = require('../config/database');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');
const { invalidatePermissionCache } = require('../utils/permissions');

// GET /roles — list all roles with their permission counts
const getRoles = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.name, r.description, r.is_system, r.created_at,
              COUNT(rp.permission_id) AS permission_count
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.name`
    );

    res.json({
      status: 'success',
      data: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.is_system,
        permissionCount: parseInt(r.permission_count, 10),
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    return next(err);
  }
};

// GET /roles/:id — get a single role with its permissions
const getRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const roleResult = await db.query(
      'SELECT id, name, description, is_system, created_at FROM roles WHERE id = $1',
      [id]
    );
    if (roleResult.rows.length === 0) {
      throw new AppError('Role not found.', 404);
    }

    const permResult = await db.query(
      `SELECT p.id, p.name, p.description, p.category
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.category, p.name`,
      [id]
    );

    const role = roleResult.rows[0];
    res.json({
      status: 'success',
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.is_system,
        createdAt: role.created_at,
        permissions: permResult.rows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// POST /roles — create a custom role
const createRole = async (req, res, next) => {
  const { name, description, permissionIds } = req.body;
  const client = await db.getClient();

  try {
    if (!name || !name.trim()) {
      throw new AppError('Role name is required.', 400);
    }

    await client.query('BEGIN');

    const roleResult = await client.query(
      `INSERT INTO roles (name, description, is_system)
       VALUES ($1, $2, false)
       RETURNING id, name, description, is_system, created_at`,
      [name.trim().toLowerCase(), description || null]
    );
    const role = roleResult.rows[0];

    if (permissionIds && permissionIds.length > 0) {
      const values = permissionIds.map((pid, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
        [role.id, ...permissionIds]
      );
    }

    await client.query('COMMIT');

    await auditLog({
      userId: req.user.id,
      action: 'CREATE_ROLE',
      resourceType: 'role',
      resourceId: role.id,
      ip: req.ip,
    });

    res.status(201).json({ status: 'success', data: role });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return next(new AppError('A role with this name already exists.', 409));
    }
    return next(err);
  } finally {
    client.release();
  }
};

// PATCH /roles/:id — update role name/description/permissions
const updateRole = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, permissionIds } = req.body;
  const client = await db.getClient();

  try {
    const existing = await client.query('SELECT is_system, name FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Role not found.', 404);
    }

    // System roles cannot be renamed, but their permissions CAN be changed
    if (existing.rows[0].is_system && name && name !== existing.rows[0].name) {
      throw new AppError('System role names cannot be changed.', 400);
    }

    await client.query('BEGIN');

    // Update role metadata
    if (name || description !== undefined) {
      await client.query(
        `UPDATE roles SET
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           updated_at = NOW()
         WHERE id = $1`,
        [id, name ? name.trim().toLowerCase() : null, description !== undefined ? description : null]
      );
    }

    // Replace permissions if provided
    if (permissionIds) {
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      if (permissionIds.length > 0) {
        const values = permissionIds.map((pid, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
          [id, ...permissionIds]
        );
      }
    }

    await client.query('COMMIT');

    // Invalidate permission cache for all users with this role
    const usersWithRole = await db.query(
      'SELECT user_id FROM user_roles WHERE role_id = $1',
      [id]
    );
    await Promise.all(usersWithRole.rows.map((r) => invalidatePermissionCache(r.user_id)));

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_ROLE',
      resourceType: 'role',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Role updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return next(new AppError('A role with this name already exists.', 409));
    }
    return next(err);
  } finally {
    client.release();
  }
};

// DELETE /roles/:id — delete a custom role
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT is_system FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Role not found.', 404);
    }
    if (existing.rows[0].is_system) {
      throw new AppError('System roles cannot be deleted.', 400);
    }

    // Invalidate caches before deleting
    const usersWithRole = await db.query(
      'SELECT user_id FROM user_roles WHERE role_id = $1',
      [id]
    );
    await Promise.all(usersWithRole.rows.map((r) => invalidatePermissionCache(r.user_id)));

    await db.query('DELETE FROM roles WHERE id = $1', [id]);

    await auditLog({
      userId: req.user.id,
      action: 'DELETE_ROLE',
      resourceType: 'role',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Role deleted successfully.' });
  } catch (err) {
    return next(err);
  }
};

// GET /permissions — list all available permissions
const getPermissions = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, description, category FROM permissions ORDER BY category, name'
    );

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// POST /users/:id/roles — assign a role to a user
const assignRoleToUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      throw new AppError('roleId is required.', 400);
    }

    await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, roleId]
    );

    await invalidatePermissionCache(id);

    await auditLog({
      userId: req.user.id,
      action: 'ASSIGN_ROLE',
      resourceType: 'user_role',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Role assigned successfully.' });
  } catch (err) {
    if (err.code === '23503') {
      return next(new AppError('User or role not found.', 404));
    }
    return next(err);
  }
};

// DELETE /users/:id/roles/:roleId — remove a role from a user
const removeRoleFromUser = async (req, res, next) => {
  try {
    const { id, roleId } = req.params;

    const result = await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING user_id',
      [id, roleId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Role assignment not found.', 404);
    }

    await invalidatePermissionCache(id);

    await auditLog({
      userId: req.user.id,
      action: 'REMOVE_ROLE',
      resourceType: 'user_role',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Role removed successfully.' });
  } catch (err) {
    return next(err);
  }
};

// GET /users/:id/roles — get roles assigned to a user
const getUserRoles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT r.id, r.name, r.description, r.is_system
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY r.name`,
      [id]
    );

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
};
