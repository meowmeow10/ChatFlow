import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera } from "lucide-react";
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
  profilePicture: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply dark mode by default on component mount
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      statusMessage: user?.statusMessage || "",
      profilePicture: user?.profilePicture || "",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Resize to max 200x200 while maintaining aspect ratio
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL with compression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfilePictureUrl(dataUrl);
        form.setValue('profilePicture', dataUrl);
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    try {
      const updateData = {
        ...data,
        profilePicture: profilePictureUrl || data.profilePicture,
      };
      await updateUser(updateData);
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
              <div className="relative">
                {profilePictureUrl || user?.profilePicture ? (
                  <img 
                    src={profilePictureUrl || user?.profilePicture} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 avatar-gradient text-xl font-bold">
                    {user?.displayName && getInitials(user.displayName)}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 p-1 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-3 h-3" />
                </Button>
              </div>
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Picture
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {(profilePictureUrl || user?.profilePicture) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProfilePictureUrl("");
                      form.setValue('profilePicture', '');
                    }}
                    className="ml-2 text-muted-foreground"
                  >
                    Remove
                  </Button>
                )}
              </div>
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
