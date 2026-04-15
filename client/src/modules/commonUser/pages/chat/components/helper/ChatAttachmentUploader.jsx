import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  } from "@/components/ui/dropdown-menu";
  import {
    Dialog,
    DialogContent,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Paperclip, ImageIcon, VideoIcon, Music, FileText, X } from "lucide-react";
  import { useRef, useState } from "react";
  
  export default function ChatAttachmentUploader() {
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const docInputRef = useRef(null);
  
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [uploadType, setUploadType] = useState(""); // image, video, audio, doc
  
    const handleFileChange = (e, type) => {
      const files = Array.from(e.target.files || []);
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
  
    const handleUpload = async () => {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
  
      // TODO: Call your RTK Query API here e.g. uploadChatFiles({ formData })
      console.log("Uploading:", uploadType, selectedFiles);
  
      setShowModal(false);
      setSelectedFiles([]);
    };
  
    return (
      <>
        {/* Dropdown Trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button"><Paperclip size={20} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => imageInputRef.current.click()}>
              <ImageIcon className="mr-2 h-4 w-4" /> Upload Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => videoInputRef.current.click()}>
              <VideoIcon className="mr-2 h-4 w-4" /> Upload Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => audioInputRef.current.click()}>
              <Music className="mr-2 h-4 w-4" /> Upload Audio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => docInputRef.current.click()}>
              <FileText className="mr-2 h-4 w-4" /> Upload Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* Hidden Inputs */}
        <input type="file" accept="image/*" multiple ref={imageInputRef} className="hidden" onChange={(e) => handleFileChange(e, "image")} />
        <input type="file" accept="video/*" multiple ref={videoInputRef} className="hidden" onChange={(e) => handleFileChange(e, "video")} />
        <input type="file" accept="audio/*" multiple ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, "audio")} />
        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple ref={docInputRef} className="hidden" onChange={(e) => handleFileChange(e, "document")} />
  
        {/* Modal for Preview */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogTitle>Preview & Upload</DialogTitle>
  
            <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  {uploadType === "image" ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-xs text-gray-700 p-2 text-center">
                      {file.name}
                    </div>
                  )}
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
              className="mt-4 w-full bg-[#0c1f4d] text-white py-2 rounded hover:bg-blue-700"
            >
              Upload
            </button>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  