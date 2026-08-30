"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCustomCommunities, listMyCommunities } from "@/lib/api/community-client";
import type { Community } from "@/lib/api/community.types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/generic/ui/Pagination";
import {
  IconHash,
  IconLifeBuoy,
  IconMessageCircle,
  IconPlus,
  IconSearch,
  IconSpinner,
  IconUsers,
} from "@/components/dashboard/icons";
import { CommunityChatPanel } from "./CommunityChatPanel";
import { CommunityMembersPanel } from "./CommunityMembersPanel";
import { CreateCustomCommunityModal } from "./CreateCustomCommunityModal";

const CUSTOM_PAGE_SIZE = 15;

function communityIcon(type: Community["type"]): ComponentType<{ className?: string }> {
  if (type === "GENERAL") return IconMessageCircle;
  if (type === "HELP") return IconLifeBuoy;
  if (type === "CUSTOM") return IconUsers;
  return IconHash;
}

function CommunityRow({
  community,
  active,
  onClick,
}: {
  community: Community;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = communityIcon(community.type);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
        active
          ? "bg-[#2D6A4F]/10 dark:bg-[#52b788]/15"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
      }`}
    >
      <div
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
          active
            ? "bg-[#2D6A4F] text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold truncate ${
            active ? "text-[#2D6A4F] dark:text-[#52b788]" : "text-gray-900 dark:text-white"
          }`}
        >
          {community.name}
        </p>
        {community.member_count !== undefined && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{community.member_count} members</p>
        )}
      </div>
    </button>
  );
}

export function CommunityHub({
  initialCommunities,
  isAdmin,
}: {
  initialCommunities: Community[];
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [browsingAllCustom, setBrowsingAllCustom] = useState(false);
  const [customPage, setCustomPage] = useState(1);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const myCommunitiesQuery = useQuery({
    queryKey: ["my_communities"],
    queryFn: listMyCommunities,
    initialData: initialCommunities,
  });

  const allCustomQuery = useQuery({
    queryKey: ["custom_communities", customPage, search],
    queryFn: () => listCustomCommunities({ page: customPage, page_size: CUSTOM_PAGE_SIZE, search: search || undefined }),
    enabled: isAdmin && browsingAllCustom,
  });

  const communities = myCommunitiesQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? communities.filter((c) => c.name.toLowerCase().includes(q)) : communities;
  }, [communities, search]);

  const pinned = filtered.filter((c) => c.type === "GENERAL" || c.type === "HELP");
  const courseCommunities = filtered.filter((c) => c.type === "COURSE");
  const customCommunities = filtered.filter((c) => c.type === "CUSTOM");

  const listSource: Community[] = browsingAllCustom ? allCustomQuery.data?.items ?? [] : [];
  const selected =
    communities.find((c) => c.id === selectedId) ?? listSource.find((c) => c.id === selectedId) ?? null;

  function selectCommunity(id: string) {
    setSelectedId(id);
    setMobileShowChat(true);
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[32rem] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`w-full sm:w-80 shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col ${
          mobileShowChat ? "hidden sm:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Communities</h2>
            {isAdmin && !browsingAllCustom && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                title="New custom community"
                className="p-1.5 rounded-lg text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 cursor-pointer"
              >
                <IconPlus />
              </button>
            )}
          </div>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          {isAdmin && (
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setBrowsingAllCustom(false)}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  !browsingAllCustom
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                My communities
              </button>
              <button
                type="button"
                onClick={() => setBrowsingAllCustom(true)}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  browsingAllCustom
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Manage all custom
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          {browsingAllCustom ? (
            allCustomQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <IconSpinner className="w-5 h-5 text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  {(allCustomQuery.data?.items ?? []).map((community) => (
                    <CommunityRow
                      key={community.id}
                      community={community}
                      active={community.id === selectedId}
                      onClick={() => selectCommunity(community.id)}
                    />
                  ))}
                  {(allCustomQuery.data?.items ?? []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No custom communities yet.</p>
                  )}
                </div>
                {allCustomQuery.data && allCustomQuery.data.meta.total_pages > 1 && (
                  <Pagination
                    currentPage={allCustomQuery.data.meta.page}
                    totalPages={allCustomQuery.data.meta.total_pages}
                    onPageChange={setCustomPage}
                  />
                )}
              </>
            )
          ) : (
            <>
              {pinned.length > 0 && (
                <div className="flex flex-col gap-1">
                  {pinned.map((community) => (
                    <CommunityRow
                      key={community.id}
                      community={community}
                      active={community.id === selectedId}
                      onClick={() => selectCommunity(community.id)}
                    />
                  ))}
                </div>
              )}
              {courseCommunities.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="px-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                    Courses
                  </p>
                  {courseCommunities.map((community) => (
                    <CommunityRow
                      key={community.id}
                      community={community}
                      active={community.id === selectedId}
                      onClick={() => selectCommunity(community.id)}
                    />
                  ))}
                </div>
              )}
              {customCommunities.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="px-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                    Custom
                  </p>
                  {customCommunities.map((community) => (
                    <CommunityRow
                      key={community.id}
                      community={community}
                      active={community.id === selectedId}
                      onClick={() => selectCommunity(community.id)}
                    />
                  ))}
                </div>
              )}
              {filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10">No communities match &quot;{search}&quot;.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 min-w-0 flex-col ${mobileShowChat ? "flex" : "hidden sm:flex"}`}>
        {selected ? (
          <>
            <div className="sm:hidden px-4 pt-3">
              <button
                onClick={() => setMobileShowChat(false)}
                className="text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                &larr; All communities
              </button>
            </div>
            <CommunityChatPanel
              communityId={selected.id}
              communityName={selected.name}
              courseId={selected.course_id}
              memberCount={selected.member_count}
              onOpenMembers={() => setMembersOpen(true)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10">
            <EmptyState
              icon={IconMessageCircle}
              title="Select a community"
              description="Pick a community from the list to view and join the conversation."
            />
          </div>
        )}
      </div>

      {membersOpen && selected && (
        <CommunityMembersPanel community={selected} isAdmin={isAdmin} onClose={() => setMembersOpen(false)} />
      )}

      {isAdmin && (
        <CreateCustomCommunityModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(community) => selectCommunity(community.id)}
        />
      )}
    </div>
  );
}
