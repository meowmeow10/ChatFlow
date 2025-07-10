import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddRoomMember } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

const addMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  roomName: string;
}

export function AddMemberModal({ open, onOpenChange, roomId, roomName }: AddMemberModalProps) {
  const addMemberMutation = useAddRoomMember();
  const { toast } = useToast();

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: AddMemberForm) => {
    try {
      const result = await addMemberMutation.mutateAsync({ 
        roomId, 
        email: data.email 
      });
      
      toast({
        title: "Member added!",
        description: `${result.user.displayName} has been added to ${roomName}.`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to add member",
        description: error.message || "Please check the email and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Member to {roomName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter user's email address"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}