import { apiClient, type ApiEnvelope } from "./client";
import type { Community } from "./community.types";

/** SSR initial data for the Communities hub — GET /community is not paginated. */
export async function listMyCommunities(token: string): Promise<Community[]> {
  const res = await apiClient.get<ApiEnvelope<Community[]>>("/community", { token });
  return res.data ?? [];
}
