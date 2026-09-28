import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInbox } from "@/lib/chat";
import ChatInbox from "@/components/chat/ChatInbox";

export const dynamic = "force-dynamic";

export default async function ChatInboxPage() {
  const session = await getSession();
  if (!session) return null;

  const rows = await getInbox(session);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={session.kind === "child" ? "/child" : "/phu-huynh"}
          aria-label="Quay lại"
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl bg-white text-muted shadow-md"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Tin nhắn</h1>
      </div>
      <ChatInbox initialRows={rows} />
    </div>
  );
}
