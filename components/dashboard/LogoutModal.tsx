"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Dialog } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";

export function LogoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && !loading && onClose()}
      dismissible={!loading}
      size="sm"
      icon={LogOut}
      iconTone="danger"
      title="Sign out"
      description="Are you sure you want to sign out? You will need to log back in to access the admin dashboard."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={loading}
            onClick={() => {
              setLoading(true);
              signOut({ callbackUrl: "/login" });
            }}
          >
            {loading ? "Signing out..." : "Yes, sign out"}
          </Button>
        </>
      }
    />
  );
}
