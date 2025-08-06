import { format } from "date-fns";

interface MessageCardProps {
  message: any;
}

export default function MessageCard({ message }: MessageCardProps) {
  return (
    <div className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
      !message.isRead ? 'bg-blue-50' : ''
    }`} data-testid={`message-card-${message.id}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-baco-primary rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">A</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">BACO Admin</p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400">
                {format(new Date(message.sentAt), 'MMM d, h:mm a')}
              </p>
              {!message.isRead && (
                <div className="w-2 h-2 bg-baco-primary rounded-full"></div>
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1 truncate" data-testid={`message-subject-${message.id}`}>
            {message.subject}
          </p>
          <p className="text-sm text-gray-500 truncate mt-1" data-testid={`message-preview-${message.id}`}>
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
