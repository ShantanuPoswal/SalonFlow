import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Barber from "@/models/Barber";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { action, customerName, serviceName } = body;

    let update: Record<string, any> = {};

    if (action === "start") {
      update = { status: "busy", currentCustomer: customerName, currentService: serviceName, startTime: new Date() };
    } else if (action === "end") {
      update = { status: "available", currentCustomer: null, currentService: null, startTime: null };
    } else if (action === "away") {
      update = { status: "away" };
    } else if (action === "available") {
      update = { status: "available" };
    } else {
      // Generic field update (e.g. { status: "away" })
      update = body;
    }

    const barber = await Barber.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(barber);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update barber" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Barber.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete barber" }, { status: 500 });
  }
}
