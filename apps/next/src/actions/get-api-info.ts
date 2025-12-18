"use server";

export async function GetApiInfo() {
  const response = await fetch(process.env.NEXT_API_URL!);
  const data: { message: string; version: string } = await response.json();
  return data;
}
