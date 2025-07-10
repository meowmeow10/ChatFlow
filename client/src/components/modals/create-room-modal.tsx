import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateRoom } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const createRoomMutation = useCreateRoom();
  const { toast } = useToast();

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const onSubmit = async (data: CreateRoomForm) => {
    try {
      await createRoomMutation.mutateAsync(data);
      toast({
        title: "Room created!",
        description: `${data.name} has been created successfully.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to create room",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              placeholder="Enter room name"
              {...form.register("name")}
              className="mt-2"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              rows={3}
              {...form.register("description")}
              className="mt-2"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={form.watch("isPrivate")}
              onCheckedChange={(checked) => 
                form.setValue("isPrivate", checked === true)
              }
            />
            <Label htmlFor="private" className="text-sm">
              Private room (invite-only)
            </Label>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={createRoomMutation.isPending}
            >
              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
