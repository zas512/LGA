/**
 * The associates module manages firm *user accounts*, so it serializes through
 * the shared UserEntity rather than duplicating the shape here.
 *
 * Note the naming overlap with the Prisma `Associate` model (the HR record that
 * attendance hangs off) — they are different things; see attendance.service.ts,
 * which resolves a User to its linked Associate.
 */
export { UserEntity as AssociateEntity } from "../../../users/entities/user.entity";
