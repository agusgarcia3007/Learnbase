export async function getApi() {
  const response = await fetch(
    "https://next-production-0283.up.railway.app/api"
  );
  const data: { message: string; version: string } = await response.json();
  return data;
}
