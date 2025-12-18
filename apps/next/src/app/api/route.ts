import { NextResponse } from "next/server";

export async function GET() {
  const resp = await fetch(process.env.NEXT_API_URL as string);
  const data: { message: string; version: string } = await resp.json();
  return NextResponse.json(data);
}
