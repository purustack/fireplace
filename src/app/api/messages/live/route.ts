import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadMessageCount } from "@/actions/messages";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ unread: 0 }, { status: 401 });
  }

  try {
    const unread = await getUnreadMessageCount();
    return NextResponse.json({ unread, at: Date.now() });
  } catch {
    return NextResponse.json({ unread: 0 }, { status: 401 });
  }
}
