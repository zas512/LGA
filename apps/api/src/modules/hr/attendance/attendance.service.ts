import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from "../../../prisma/prisma.service";
import { JwtPayload } from "../../auth/strategies/access-token.strategy";
import { AttendanceStatus, AttendanceSource } from "../../../generated/prisma/client";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to resolve or lazy-create associate ID for a user
  private async getOrCreateAssociateId(user: JwtPayload): Promise<string> {
    const userDb = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, associateId: true, email: true, name: true, firmId: true }
    });

    if (!userDb) {
      throw new NotFoundException("User not found");
    }

    if (userDb.associateId) {
      return userDb.associateId;
    }

    if (!userDb.firmId) {
      throw new BadRequestException("User must belong to a firm to track attendance");
    }

    // Lazy create Associate record
    const newAssociate = await this.prisma.associate.create({
      data: {
        firmId: userDb.firmId,
        fullName: userDb.name || userDb.email.split('@')[0],
        email: userDb.email,
        joiningDate: new Date(),
        salary: 0,
        status: 'ACTIVE'
      }
    });

    // Link back to user
    await this.prisma.user.update({
      where: { id: userDb.id },
      data: { associateId: newAssociate.id }
    });

    return newAssociate.id;
  }

  // Get all attendance records for the active user
  async findAllForUser(user: JwtPayload) {
    const associateId = await this.getOrCreateAssociateId(user);
    return this.prisma.attendance.findMany({
      where: { associateId },
      orderBy: [
        { date: 'desc' },
        { checkIn: 'desc' }
      ]
    });
  }

  // Perform Check In
  async checkIn(user: JwtPayload, notes?: string) {
    const associateId = await this.getOrCreateAssociateId(user);
    
    // Check if there is an active check-in (checkOut is null)
    const active = await this.prisma.attendance.findFirst({
      where: { associateId, checkOut: null }
    });

    if (active) {
      throw new BadRequestException("You are already checked in!");
    }

    const now = new Date();
    // Use date part in local server timezone
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return this.prisma.attendance.create({
      data: {
        associateId,
        date: dateOnly,
        checkIn: now,
        checkOut: null,
        status: AttendanceStatus.PRESENT,
        source: AttendanceSource.REMOTE_CHECKIN,
        notes: notes || "Web Portal Check-In"
      }
    });
  }

  // Perform Check Out
  async checkOut(user: JwtPayload, notes?: string) {
    const associateId = await this.getOrCreateAssociateId(user);

    // Find active check-in
    const active = await this.prisma.attendance.findFirst({
      where: { associateId, checkOut: null }
    });

    if (!active) {
      throw new BadRequestException("You are not checked in!");
    }

    const now = new Date();
    const durationHrs = active.checkIn ? (now.getTime() - new Date(active.checkIn).getTime()) / (1000 * 60 * 60) : 0;
    
    // Determine status: less than 4 hours is half day
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (durationHrs < 4) {
      status = AttendanceStatus.HALF_DAY;
    }

    return this.prisma.attendance.update({
      where: { id: active.id },
      data: {
        checkOut: now,
        status,
        notes: notes ? `${active.notes || ""}\nCheckout: ${notes}`.trim() : active.notes
      }
    });
  }

  // Create manual attendance (past record)
  async createManual(user: JwtPayload, body: { date: string; checkIn: string; checkOut: string; status: AttendanceStatus; notes?: string }) {
    const associateId = await this.getOrCreateAssociateId(user);
    
    const checkInDate = new Date(body.checkIn);
    const checkOutDate = new Date(body.checkOut);
    const dateOnly = new Date(body.date + "T00:00:00");

    return this.prisma.attendance.create({
      data: {
        associateId,
        date: dateOnly,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: body.status,
        source: AttendanceSource.MANUAL_ADMIN,
        notes: body.notes || "Manual Entry"
      }
    });
  }

  // Update an attendance record
  async update(user: JwtPayload, id: string, body: { date?: string; checkIn?: string; checkOut?: string; status?: AttendanceStatus; notes?: string }) {
    const associateId = await this.getOrCreateAssociateId(user);

    // Find the record to verify ownership
    const record = await this.prisma.attendance.findUnique({
      where: { id }
    });

    if (!record || record.associateId !== associateId) {
      throw new NotFoundException("Attendance record not found");
    }

    const data: any = {};
    if (body.date) data.date = new Date(body.date + "T00:00:00");
    if (body.checkIn) data.checkIn = new Date(body.checkIn);
    if (body.checkOut) data.checkOut = new Date(body.checkOut);
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;

    // Auto update status if checkIn and checkOut are updated
    if (data.checkIn || data.checkOut) {
      const inTime = data.checkIn ? data.checkIn.getTime() : (record.checkIn ? new Date(record.checkIn).getTime() : 0);
      const outTime = data.checkOut ? data.checkOut.getTime() : (record.checkOut ? new Date(record.checkOut).getTime() : null);
      if (outTime) {
        const hours = (outTime - inTime) / (1000 * 60 * 60);
        data.status = hours < 4 ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT;
      }
    }

    return this.prisma.attendance.update({
      where: { id },
      data
    });
  }

  // Delete an attendance record
  async remove(user: JwtPayload, id: string) {
    const associateId = await this.getOrCreateAssociateId(user);

    const record = await this.prisma.attendance.findUnique({
      where: { id }
    });

    if (!record || record.associateId !== associateId) {
      throw new NotFoundException("Attendance record not found");
    }

    return this.prisma.attendance.delete({
      where: { id }
    });
  }
}
