import { NextRequest, NextResponse } from "next/server";
const API_URL = process.env.NEXT_API_URL;
export async function GET(request: NextRequest, response: NextResponse) {
  const resp = await fetch(process.env.NEXT_API_URL as string);
  const data: { message: string; version: string } = await resp.json();
  return NextResponse.json(data);
}
