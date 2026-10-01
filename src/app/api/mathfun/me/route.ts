import { NextResponse } from "next/server";
import { getMathfunUser } from "@/lib/mathfun/auth";

export async function GET() {
  const user = await getMathfunUser();
  return NextResponse.json({ user });
}
