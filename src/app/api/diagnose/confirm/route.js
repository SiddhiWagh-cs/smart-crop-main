import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import FarmerHistory from '@/models/FarmerHistory';

const JWT_SECRET = process.env.JWT_SECRET;

export async function PATCH(request) {
  try {
    if (!JWT_SECRET) throw new Error('JWT_SECRET missing');

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 });
    }

    const userId = decoded.id || decoded.userId;
    const { historyId, confirmed } = await request.json();

    if (!historyId || confirmed === undefined) {
      return NextResponse.json(
        { success: false, error: 'historyId and confirmed status required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedLog = await FarmerHistory.findOneAndUpdate(
      { _id: historyId, userId },
      { $set: { 'resultData.farmerConfirmed': confirmed } },
      { new: true }
    );

    if (!updatedLog) {
      return NextResponse.json({ success: false, error: 'Record not found or not yours' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}