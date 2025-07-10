import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  statusMessage: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      statusMessage: user?.statusMessage || "",
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const onSubmit = async (data: SettingsForm) => {
    try {
      await updateUser(data);
      toast({
        title: "Settings updated!",
        description: "Your profile has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to update settings",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Profile</h4>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 avatar-gradient text-xl font-bold">
                {user?.displayName && getInitials(user.displayName)}
              </div>
              <Button variant="outline">
                Change Picture
              </Button>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...form.register("displayName")}
                  className="mt-2"
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="statusMessage">Status Message</Label>
                <Input
                  id="statusMessage"
                  placeholder="What's your status?"
                  {...form.register("statusMessage")}
                  className="mt-2"
                />
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Preferences</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode">Dark Mode</Label>
                <Switch
                  id="darkMode"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="soundNotifications">Sound Notifications</Label>
                <Switch
                  id="soundNotifications"
                  checked={soundNotifications}
                  onCheckedChange={setSoundNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showOnlineStatus">Show Online Status</Label>
                <Switch
                  id="showOnlineStatus"
                  checked={showOnlineStatus}
                  onCheckedChange={setShowOnlineStatus}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-border">
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
              onClick={form.handleSubmit(onSubmit)}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
