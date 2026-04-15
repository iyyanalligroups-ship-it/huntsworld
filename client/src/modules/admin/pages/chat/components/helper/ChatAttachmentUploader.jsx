import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, ImageIcon, FileText, X } from "lucide-react";
import { useRef, useState } from "react";
import { useUploadMessageImagesMutation } from "@/redux/api/MessageImagesApi";

export default function ChatAttachmentUploader({ senderId, receiverId, onUploadComplete }) {
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [uploadChatFiles, { isLoading }] = useUploadMessageImagesMutation();

  console.log("ChatAttachmentUploader props:", { senderId, receiverId, onUploadComplete });

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files || []);
    console.log("Files selected:", files, "Type:", type);
    if (files.length) {
      setUploadType(type);
      setSelectedFiles(files);
      setShowModal(true);
    }
  };

  const handleDeleteImage = (idx) => {
    const updated = [...selectedFiles];
    updated.splice(idx, 1);
    setSelectedFiles(updated);
  };

  const getFileIcon = (file, type) => {
    if (type === "image") {
      return <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded" />;
    }
    return <FileText className="w-12 h-12 text-gray-700" />;
  };

  const handleUpload = async () => {
    console.log("Upload button clicked", { senderId, receiverId, selectedFiles });
    if (!selectedFiles.length || !senderId || !receiverId) {
      console.log("Validation failed: Missing files, senderId, or receiverId");
      return;
    }

    const formData = new FormData();
    formData.append("senderId", senderId);
    formData.append("receiverId", receiverId);
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await uploadChatFiles(formData).unwrap();
      console.log("Upload response:", response);
      const fileUrls = response?.fileUrls;
      if (fileUrls?.length) {
        onUploadComplete(fileUrls);
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }

    setShowModal(false);
    setSelectedFiles([]);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">
            <Paperclip size={20} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={() => imageInputRef.current.click()}>
            <ImageIcon className="mr-2 h-4 w-4" /> Upload Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => docInputRef.current.click()}>
            <FileText className="mr-2 h-4 w-4" /> Upload File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={imageInputRef}
        className="hidden"
        onChange={(e) => handleFileChange(e, "image")}
      />
      <input
        type="file"
        multiple
        ref={docInputRef}
        className="hidden"
        onChange={(e) => handleFileChange(e, "document")}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogTitle>Preview & Upload</DialogTitle>
          <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative w-24 h-24">
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                  {getFileIcon(file, uploadType)}
                </div>
                <button
                  onClick={() => handleDeleteImage(idx)}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                >
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Uploading..." : "Upload"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
