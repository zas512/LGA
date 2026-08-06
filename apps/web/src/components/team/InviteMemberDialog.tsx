"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { inviteMember, type InviteResult } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Loader2, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const inviteSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  role: z.enum(["ADMIN", "ASSOCIATE"], {
    error: () => ({ message: "Role must be ADMIN or ASSOCIATE" })
  })
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sends a member invite by email. On success it shows the shareable invite
 * link (also delivered by Resend when configured) with a one-click copy.
 */
export function InviteMemberDialog({
  open,
  onOpenChange
}: Readonly<InviteMemberDialogProps>) {
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "ASSOCIATE" }
  });

  // Reset state whenever the dialog opens fresh.
  useEffect(() => {
    if (open) {
      setResult(null);
      setCopied(false);
      reset();
    }
  }, [open, reset]);

  const inviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) => inviteMember(values),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Invitation sent to ${data.email}`);
    },
    onError: (err: Error) => {
      toast.error(getErrorMessage(err, "Failed to create invitation"));
    }
  });

  const onSubmit = handleSubmit((values) => inviteMutation.mutate(values));

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the invite link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invite Member
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send an email invitation to join your firm. They&apos;ll create
            their own account from the link.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Invite created for {result.email}. Share this link with them:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={result.inviteUrl}
                className="bg-card border-border text-xs rounded-xl font-mono"
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyLink}
                aria-label="Copy invite link"
                className="rounded-xl shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs font-bold"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
              <Button
                type="button"
                className="rounded-xl text-xs font-bold"
                onClick={() => {
                  setResult(null);
                  reset();
                }}
              >
                Invite another
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-bold text-foreground">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="associate@laalglobal.com"
                {...register("email")}
                disabled={inviteMutation.isPending}
                className="bg-card border-border text-xs rounded-xl"
              />
              {errors.email && (
                <p className="text-xs text-destructive font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs font-bold text-foreground">
                Assigned Role <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={inviteMutation.isPending}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs shadow-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSOCIATE">
                        ASSOCIATE (Legal Counsel)
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        ADMIN (Operations Assistant)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs text-destructive font-semibold">
                  {errors.role.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={inviteMutation.isPending}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold gap-1.5"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
