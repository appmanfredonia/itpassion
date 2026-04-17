import { completeAuthCallback } from "@/app/(auth)/actions";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  await completeAuthCallback(requestUrl.searchParams);
}

