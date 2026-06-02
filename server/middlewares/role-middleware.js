/*
Role-Based Access Control
roleMiddleware(allowedRoles: string[]) – Restrict route access by role
permissionMiddleware(requiredPermissions: string[]) – Fine-grained access
*/

// Role-based middleware to restrict access based on user role
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: User role information missing',
      });
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${req.user.role} role is not authorized for this action`,
      });
    }

    // User has an allowed role, proceed to the next middleware/route handler
    next();
  };
};

// Permission-based middleware for fine-grained access control
const permissionMiddleware = (requiredPermissions) => {
  return (req, res, next) => {
    // Check if user exists and has permissions
    if (!req.user || !req.user.permissions || !Array.isArray(req.user.permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: User permission information missing',
      });
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      req.user.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions for this action',
      });
    }

    // User has all required permissions, proceed to the next middleware/route handler
    next();
  };
};

module.exports = {
  roleMiddleware,
  permissionMiddleware,
};
