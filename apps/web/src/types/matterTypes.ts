export interface MatterDetailProps {
  id: string;
  userRole: string | undefined;
  userId: string | undefined;
}

export interface CourtStage {
  id: string;
  name: string;
  caseType: string;
  sequenceOrder: number;
}

export interface Associate {
  id: string;
  name?: string | null;
  email: string;
}
