import type { IUserProfileDB } from '../types/user.types'

export const isSellerEmployeeAccount = (user?: Partial<IUserProfileDB> | null) =>
  user?.role === 'employee' ||
  Boolean(user?.employeeId) ||
  Boolean(user?.actorUserId && user?.merchantUserId && user.actorUserId !== user.merchantUserId)
