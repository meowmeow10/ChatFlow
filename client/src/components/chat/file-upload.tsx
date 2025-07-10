import { useRef, useState } from "react";
import { Upload, X, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processFile, formatFileSize, getFileIcon, isImageType, type FileData } from "@/lib/fileUtils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (fileData: FileData) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const fileData = await processFile(file);
      setPreviewFile(fileData);
    } catch (error: any) {
      toast({
        title: "File upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendFile = () => {
    if (previewFile) {
      onFileSelect(previewFile);
      setPreviewFile(null);
    }
  };

  const handleCancelPreview = () => {
    setPreviewFile(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (previewFile) {
    return (
      <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 bg-background">
        <div className="flex items-start space-x-3">
          {isImageType(previewFile.mimeType) ? (
            <img
              src={previewFile.fileUrl}
              alt={previewFile.fileName}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-2xl">
              {getFileIcon(previewFile.mimeType)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {previewFile.fileName}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(previewFile.fileSize)}
            </p>
            
            <div className="flex space-x-2 mt-3">
              <Button size="sm" onClick={handleSendFile}>
                Send File
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelPreview}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,audio/*,video/*"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={triggerFileSelect}
        disabled={disabled || isProcessing}
        className="h-10 w-10 p-0"
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </Button>
      
      <Button
        type="button"
        variant="ghost" 
        size="sm"
        onClick={() => {
          fileInputRef.current?.click();
        }}
        disabled={disabled || isProcessing}
        className="h-10 w-10 p-0"
      >
        <Image className="w-4 h-4" />
      </Button>
    </div>
  );
}