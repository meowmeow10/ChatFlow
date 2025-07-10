import { Download, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, getFileIcon, isImageType } from "@/lib/fileUtils";

interface MessageAttachmentProps {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  messageType: string;
}

export function MessageAttachment({ 
  fileName, 
  fileUrl, 
  fileSize, 
  mimeType, 
  messageType 
}: MessageAttachmentProps) {
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(fileUrl, '_blank');
  };

  if (messageType === 'image' && isImageType(mimeType)) {
    return (
      <div className="max-w-xs md:max-w-sm">
        <img
          src={fileUrl}
          alt={fileName}
          className="rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleView}
          loading="lazy"
          style={{
            // Ensure GIFs play automatically and loop
            ...(mimeType === 'image/gif' && {
              imageRendering: 'auto',
            })
          }}
        />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span className="truncate">{fileName}</span>
          <span>{formatFileSize(fileSize)}</span>
        </div>
      </div>
    );
  }

  // For non-image files, show a file card
  return (
    <div className="border border-border rounded-lg p-3 bg-muted/30 max-w-xs md:max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="text-2xl flex-shrink-0">
          {getFileIcon(mimeType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>
          
          <div className="flex space-x-1 mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="h-6 px-2 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            
            {(mimeType === 'application/pdf' || mimeType.startsWith('text/')) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleView}
                className="h-6 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}