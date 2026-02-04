// Shared frontend types that mirror the backend schema

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  phone?: string;
  address?: string;
  membershipType?: string;
  membershipStatus: string;
  joinDate?: string;
  nextPaymentDate?: string;
  annualFee?: string;
  position?: string;
  company?: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  price: string;
  memberPrice?: string;
  nonMemberPrice?: string;
  maxAttendees?: number;
  currentAttendees: number;
  status: string;
  isPublic: boolean;
  registrationClosed: boolean;
  flyerImageUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  position?: string;
  phoneNumber?: string;
  notes?: string;
  registrationType?: string;
  paymentMethod?: string;
  registrationDate: string;
  paymentStatus: string;
  paymentAmount?: string;
  externalPaymentId?: string;
  membershipType?: string;
  isPaid: boolean;
  paymentMethodTracking?: string;
  cros?: string;
  adminNotes?: string;
  event?: Event;
}

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  objectPath: string;
  category?: string;
  status: string;
  uploadDate: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  type: string;
  status: string;
  externalPaymentId?: string;
  paymentPlatform?: string;
  orderNumber?: string;
  eventId?: string;
  paymentDate: string;
  description?: string;
  createdAt?: string;
}

export interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  pendingDocuments: number;
}

export interface UnreadCount {
  count: number;
}

export interface CngPaymentStatus {
  available: boolean;
}
