import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Booking from "@/models/Booking";
import Barber from "@/models/Barber";

// High-level slot allocation engine (Multi-tenant)
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const duration = parseInt(searchParams.get("duration") || "30");
    const barberId = searchParams.get("barberId");
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json({ error: "salonId is required" }, { status: 400 });
    }

    const barbers = barberId
      ? await Barber.find({ _id: barberId, salonId })
      : await Barber.find({ salonId, status: { $ne: "away" } });

    const now = new Date();
    // Start slot generation from now rounded up to next 10 mins
    const roundedNowMs = Math.ceil(now.getTime() / (1000 * 60 * 10)) * (1000 * 60 * 10);
    const startOfLogic = new Date(roundedNowMs);

    // Salon business hours (e.g. 09:00 to 22:00)
    const eod = new Date(now);
    eod.setHours(22, 0, 0, 0);

    const slotsByBarber: Record<string, any> = {};
    let earliestGlobalSlot: any = null;

    for (const barber of barbers) {
      // Find all pending and in-progress bookings for this barber in THIS salon
      const activeBookings = await Booking.find({
        barberId: barber._id,
        salonId,
        status: { $in: ["pending", "in-progress"] },
        scheduledTime: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
      }).sort({ scheduledTime: 1 });

      // Convert bookings into blocked intervals
      const blockedIntervals: { start: number; end: number }[] = [];

      for (const b of activeBookings) {
        if (b.status === "in-progress" && barber.startTime) {
          const elapsedMs = now.getTime() - new Date(barber.startTime).getTime();
          const remainingMs = Math.max(0, (b.serviceDuration * 60 * 1000) - elapsedMs);
          blockedIntervals.push({ start: now.getTime(), end: now.getTime() + remainingMs });
        } else {
          const sDate = new Date(b.scheduledTime).getTime();
          const eDate = new Date(b.scheduledEndTime || (sDate + b.serviceDuration * 60 * 1000)).getTime();
          blockedIntervals.push({ start: sDate, end: eDate });
        }
      }

      blockedIntervals.sort((a, b) => a.start - b.start);
      const mergedBlocks: { start: number; end: number }[] = [];
      for (const block of blockedIntervals) {
        if (!mergedBlocks.length) { mergedBlocks.push(block); }
        else {
          const last = mergedBlocks[mergedBlocks.length - 1];
          if (block.start <= last.end) { last.end = Math.max(last.end, block.end); }
          else { mergedBlocks.push(block); }
        }
      }

      const reqDurationMs = duration * 60 * 1000;
      const slots = [];
      let cursor = startOfLogic.getTime();

      let attempts = 0;
      while (slots.length < 6 && cursor + reqDurationMs <= eod.getTime() && attempts < 100) {
        attempts++;
        const proposedStart = cursor;
        const proposedEnd = cursor + reqDurationMs;

        let isOverlapping = false;
        let jumpTo = 0;

        for (const block of mergedBlocks) {
          if (proposedStart < block.end && proposedEnd > block.start) {
            isOverlapping = true;
            jumpTo = block.end;
            break;
          }
        }

        if (isOverlapping) {
          cursor = Math.max(cursor + (10 * 60 * 1000), jumpTo);
          cursor = Math.ceil(cursor / (1000 * 60 * 10)) * (1000 * 60 * 10);
        } else {
          const slotStartTime = new Date(proposedStart);
          const isImmediate = proposedStart - now.getTime() <= 5 * 60 * 1000;
          slots.push({
            startTime: slotStartTime.toISOString(),
            label: formatSlotLabel(slotStartTime, now),
            isNow: isImmediate,
          });
          cursor += 15 * 60 * 1000;
        }
      }

      const nextFreeTime = slots.length > 0 ? new Date(slots[0].startTime) : null;
      let waitMinutes = 0;
      if (nextFreeTime) { waitMinutes = Math.max(0, Math.round((nextFreeTime.getTime() - now.getTime()) / 60000)); }

      slotsByBarber[barber._id.toString()] = {
        barber: { _id: barber._id, name: barber.name, status: barber.status, avatarColor: barber.avatarColor },
        slots,
        nextFreeTime,
        waitMinutes,
      };

      if (slots.length > 0) {
        const earliestForThisBarber = slots[0];
        const sTime = new Date(earliestForThisBarber.startTime).getTime();
        
        if (!earliestGlobalSlot || sTime < new Date(earliestGlobalSlot.startTime).getTime()) {
          earliestGlobalSlot = {
            barberId: barber._id,
            barberName: barber.name,
            startTime: earliestForThisBarber.startTime,
            waitMinutes,
            isImmediate: earliestForThisBarber.isNow,
            avatarColor: barber.avatarColor
          };
        }
      }
    }

    return NextResponse.json({
      slotsByBarber,
      anyAvailable: earliestGlobalSlot ? earliestGlobalSlot : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to compute slots" }, { status: 500 });
  }
}

function formatSlotLabel(time: Date, now: Date): string {
  const diffMs = time.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 5) return "Next Ready⚡";
  const h = time.getHours();
  const m = time.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${m} ${ampm}`;
}
