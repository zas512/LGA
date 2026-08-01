/**
 * Retained as the historical name for this module's create payload; the
 * definition now lives with the shared firm-member DTOs so `/users` and
 * `/associates` validate identically.
 */
export {
  CreateFirmMemberDto as CreateTeamMemberDto,
  UpdateFirmMemberDto as UpdateTeamMemberDto
} from "./firm-member.dto";
