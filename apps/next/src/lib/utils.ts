export async function getApi() {
  const response = await fetch(process.env.NEXT_API_URL as string);
  const data: { message: string; version: string } = await response.json();
  return data;
}
