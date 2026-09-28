export const success = (res, data, status = 200) => res.status(status).json({ success: true, data })
export const publicUser = ({ passwordHash: _passwordHash, ...user }) => user
