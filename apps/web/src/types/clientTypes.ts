export interface ClientMatterSummary {
  id: string;
  firmCaseNumber: string;
  courtCaseNumber?: string | null;
  caseType: string;
  status: string;
  filingDate?: string | null;
  clientName: string;
}

export interface Client {
  id: string;
  firmId: string;
  name: string;
  clientType: "INDIVIDUAL" | "COMPANY" | "GOVERNMENT";
  contactPerson?: string | null;
  cnic?: string | null;
  companyRegistration?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  matters?: ClientMatterSummary[];
}

export interface Lead {
  id: string;
  firmId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cnic?: string | null;
  practiceArea?: string | null;
  source:
    | "REFERRAL"
    | "WEBSITE"
    | "WALK_IN"
    | "SOCIAL"
    | "PHONE"
    | "OTHER";
  description?: string | null;
  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "CONVERTED"
    | "REJECTED"
    | "ARCHIVED";
  assignedToId?: string | null;
  convertedToClientId?: string | null;
  convertedToMatterId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    fullName: string;
    email?: string | null;
    designation?: string | null;
  } | null;
  convertedToClient?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export interface ConflictCheckMatch {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cnic?: string | null;
  status?: string;
  matters?: Array<{
    id: string;
    firmCaseNumber: string;
    courtCaseNumber?: string | null;
    caseType: string;
    status: string;
    clientName?: string;
  }>;
}

export interface ConflictCheckResult {
  clients: ConflictCheckMatch[];
  parties: ConflictCheckMatch[];
  legacyMatters: Array<{
    id: string;
    firmCaseNumber: string;
    caseType: string;
    status: string;
    clientName: string;
  }>;
}
