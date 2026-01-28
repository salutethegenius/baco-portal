import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("upload-success", (file, response) => {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ObjectUploader.tsx:upload-success',message:'Upload success event fired',data:{fileName:file.name,hasResponse:!!response,responseStatus:response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      })
      .on("complete", (result) => {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ObjectUploader.tsx:complete event',message:'Upload complete event fired',data:{hasSuccessful:!!result.successful,successfulCount:result.successful?.length,hasFailed:!!result.failed,failedCount:result.failed?.length,resultKeys:Object.keys(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (result.successful && result.successful.length > 0) {
          const firstSuccess = result.successful[0];
          // #region agent log
          fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ObjectUploader.tsx:complete event',message:'Successful upload details',data:{uploadURL:firstSuccess.uploadURL,url:firstSuccess.url,response:firstSuccess.response,keys:Object.keys(firstSuccess)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
        onComplete?.(result);
        // Close modal after a short delay to allow callback to process
        setTimeout(() => {
          setShowModal(false);
          // Reset uppy state for next upload
          uppyInstance.reset();
        }, 500);
      })
      .on("upload-error", (file, error, response) => {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ObjectUploader.tsx:upload-error',message:'Upload error event',data:{error:error?.message,response:response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      });
    return uppyInstance;
  });

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-open-uploader">
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => {
          setShowModal(false);
          uppy.reset();
        }}
        proudlyDisplayPoweredByUppy={false}
        closeAfterFinish={true}
        closeModalOnClickOutside={true}
      />
    </div>
  );
}

export { ObjectUploader };
export default ObjectUploader;
