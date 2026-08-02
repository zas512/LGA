"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";

// Add Party Schema
const addPartySchema = z
  .object({
    partyRole: z.enum([
      "PLAINTIFF",
      "DEFENDANT",
      "PETITIONER",
      "RESPONDENT",
      "ACCUSED",
      "COMPLAINANT",
      "OPPOSING_COUNSEL",
      "CO_COUNSEL",
      "WITNESS",
      "COURT_CLERK"
    ]),
    selectType: z.enum(["EXISTING", "NEW"]),
    partyId: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    isExternal: z.boolean().default(true)
  })
  .refine(
    (data) => {
      if (data.selectType === "EXISTING" && !data.partyId) return false;
      if (data.selectType === "NEW" && !data.name) return false;
      return true;
    },
    {
      message: "Either select an existing contact or enter a new name.",
      path: ["name"]
    }
  );

type AddPartyValues = z.infer<typeof addPartySchema>;

interface PartyContact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  isExternal: boolean;
}

interface MatterPartyLink {
  id: string;
  partyId: string;
  partyRole:
    | "PLAINTIFF"
    | "DEFENDANT"
    | "PETITIONER"
    | "RESPONDENT"
    | "ACCUSED"
    | "COMPLAINANT"
    | "OPPOSING_COUNSEL"
    | "CO_COUNSEL"
    | "WITNESS"
    | "COURT_CLERK";
  party?: PartyContact | null;
}

interface MatterPartiesProps {
  matter: {
    id: string;
    parties: MatterPartyLink[];
  };
  userRole: string;
}

export function MatterParties({
  matter,
  userRole
}: Readonly<MatterPartiesProps>) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const canEdit = userRole === "OWNER" || userRole === "ADMIN";

  // Fetch unique firm contacts for dropdown selection
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<
    PartyContact[]
  >({
    queryKey: ["parties-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/matters/parties");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: canEdit && isOpen
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AddPartyValues>({
    resolver: zodResolver(addPartySchema),
    defaultValues: {
      partyRole: "PLAINTIFF",
      selectType: "NEW",
      partyId: "",
      name: "",
      phone: "",
      email: "",
      isExternal: true
    }
  });

  const selectType = watch("selectType");

  const addPartyMutation = useMutation({
    mutationFn: async (values: AddPartyValues) => {
      const payload: {
        partyRole: string;
        partyId?: string;
        name?: string;
        phone?: string;
        email?: string;
        isExternal?: boolean;
      } = {
        partyRole: values.partyRole
      };
      if (values.selectType === "EXISTING") {
        payload.partyId = values.partyId;
      } else {
        payload.name = values.name;
        payload.phone = values.phone || undefined;
        payload.email = values.email || undefined;
        payload.isExternal = values.isExternal;
      }

      const res = await fetch(`/api/matters/${matter.id}/parties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to link party to case");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Party successfully linked to case roster.");
      reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to link party");
    }
  });

  const onSubmit = (values: AddPartyValues) => {
    addPartyMutation.mutate(values);
  };

  const getRoleBadgeVariant = (role: string) => {
    if (["PLAINTIFF", "PETITIONER", "COMPLAINANT"].includes(role))
      return "emerald";
    if (["DEFENDANT", "RESPONDENT", "ACCUSED"].includes(role))
      return "destructive";
    if (role === "OPPOSING_COUNSEL") return "amber";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Litigants & Contacts Roster
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Manage opposing counsels, witnesses, plaintiffs, defendants, and
            clerks associated with this case.
          </p>
        </div>
        <div>
          {canEdit && (
            <Button
              onClick={() => setIsOpen(true)}
              className="skeuo-button-primary rounded-xl text-sm font-bold gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Link Litigant / Party</span>
            </Button>
          )}
        </div>
      </div>

      {/* Litigants Table Card */}
      <Card className="skeuo-card bg-card text-card-foreground">
        <CardContent className="p-0">
          {matter.parties.length === 0 ? (
            <div className="text-center p-12 space-y-2">
              <Users className="h-10 w-10 text-muted-foreground/60 mx-auto" />
              <p className="font-bold text-foreground text-base">
                No linked parties
              </p>
              <p className="text-sm text-muted-foreground">
                Link litigants, counsel or witnesses to list them here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">
                    Contact Name
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">
                    Case Association Role
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">
                    Scope Classification
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">
                    Phone
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">
                    Email Address
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matter.parties.map((lnk) => {
                  const name = lnk.party?.name || "Unresolved Party";
                  const role = lnk.partyRole;
                  const isExternal = lnk.party?.isExternal ?? true;
                  const phone = lnk.party?.phone || "N/A";
                  const email = lnk.party?.email || "N/A";
                  const initials = name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <TableRow
                      key={lnk.id}
                      className="border-b border-border hover:bg-muted/10"
                    >
                      <TableCell className="px-4 py-2 text-sm font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <span>{name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm">
                        <Badge
                          variant={getRoleBadgeVariant(role)}
                          className="text-xs font-bold uppercase tracking-wide"
                        >
                          {role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm">
                        <Badge
                          variant="outline"
                          className="text-xs font-bold"
                        >
                          {isExternal ? "External Litigant" : "Internal Client"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary/70" />
                          {phone}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-primary/70" />
                          {email}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Party Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              Link Litigant / Opposing Counsel
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add litigants, witnesses, opposing counsels or judicial clerks to
              the case.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Case Association Role */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">
                Case Association Role *
              </Label>
              <select
                id="partyRole"
                {...register("partyRole")}
                className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
              >
                <option value="PLAINTIFF">Plaintiff (Civil)</option>
                <option value="DEFENDANT">Defendant (Civil)</option>
                <option value="PETITIONER">Petitioner (Writ)</option>
                <option value="RESPONDENT">Respondent (Writ)</option>
                <option value="ACCUSED">Accused (Criminal)</option>
                <option value="COMPLAINANT">Complainant (Criminal)</option>
                <option value="OPPOSING_COUNSEL">Opposing Counsel</option>
                <option value="CO_COUNSEL">Co-Counsel</option>
                <option value="WITNESS">Witness</option>
                <option value="COURT_CLERK">Court Clerk</option>
              </select>
            </div>

            {/* Select existing or create inline */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Contact Source
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    value="NEW"
                    checked={selectType === "NEW"}
                    onChange={() => setValue("selectType", "NEW")}
                    className="text-primary focus:ring-primary/40"
                  />
                  <span>Create new contact inline</span>
                </label>
                <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    value="EXISTING"
                    checked={selectType === "EXISTING"}
                    onChange={() => setValue("selectType", "EXISTING")}
                    className="text-primary focus:ring-primary/40"
                  />
                  <span>Pick from existing contacts</span>
                </label>
              </div>
            </div>

            {/* Form Fields: Pick Existing */}
            {selectType === "EXISTING" && (
              <div className="space-y-1">
                <Label
                  htmlFor="partyId"
                  className="text-xs font-bold text-foreground"
                >
                  Select Firm Contact *
                </Label>
                {isLoadingContacts ? (
                  <div className="flex items-center text-sm text-muted-foreground gap-1.5 py-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Fetching contacts roster...</span>
                  </div>
                ) : (
                  <select
                    id="partyId"
                    {...register("partyId")}
                    className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                  >
                    <option value="">Choose contact</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email || c.phone || "No contact info"})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Form Fields: Create Inline */}
            {selectType === "NEW" && (
              <div className="space-y-3 p-3 border border-border/80 rounded-xl bg-muted/10">
                <div className="space-y-1">
                  <Label
                    htmlFor="name"
                    className="text-xs font-bold text-foreground"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    {...register("name")}
                    className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive font-semibold">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-bold text-foreground"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="e.g. +923001234567"
                      {...register("phone")}
                      className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
                      className="text-xs font-bold text-foreground"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      placeholder="e.g. litigant@gmail.com"
                      {...register("email")}
                      className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isExternal"
                    {...register("isExternal")}
                    className="rounded text-primary focus:ring-primary/40 h-4 w-4"
                  />
                  <Label
                    htmlFor="isExternal"
                    className="text-sm font-semibold cursor-pointer select-none"
                  >
                    External entity (Opponent / Opposing Counsel / Clerk)
                  </Label>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  reset();
                }}
                className="rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Linking...</span>
                  </>
                ) : (
                  <span>Link Party</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
