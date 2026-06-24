export async function getRealtimeToken(): Promise<string> {
  const response = await fetch("/api/token");

  if (!response.ok) {
    throw new Error("Failed to get realtime token");
  }

  const data = await response.json();

  return data.value;
}