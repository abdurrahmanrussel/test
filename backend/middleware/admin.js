// Admin middleware to check if user has admin role
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ 
      error: 'Admin access required' 
    })
  }
}

export default {
  requireAdmin
}