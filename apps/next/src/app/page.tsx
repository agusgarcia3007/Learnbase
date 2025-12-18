import { GetApiInfo } from "@/actions/get-api-info";

export default async function Home() {
  const { message, version } = await GetApiInfo();
  return (
    <div>
      <h1>{message}</h1>
      <p>{version}</p>
    </div>
  );
}
