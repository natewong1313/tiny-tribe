"use client";

import { FilePond, registerPlugin } from "react-filepond";
import { useCallback, useState, useEffect } from "react";

import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "./filepond-custom.css";

interface FilePondUploadProps {
  photoLabelId: string;
  onChange: (fileName: string, file: File | null) => void;
  errors?: string[];
}

export function FilePondUpload({ photoLabelId, onChange, errors }: FilePondUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Register plugins only on client side
    import("filepond-plugin-image-exif-orientation").then((mod) => {
      import("filepond-plugin-image-preview").then((mod2) => {
        registerPlugin(mod.default, mod2.default);
        setIsClient(true);
      });
    });
  }, []);

  const handleUpdateFiles = useCallback(
    (fileItems: Array<{ file: File | null }>) => {
      const newFiles = fileItems
        .map((fileItem) => fileItem.file)
        .filter((file): file is File => file !== null);
      setFiles(newFiles);
      const firstFile = newFiles[0] ?? null;
      onChange(firstFile?.name ?? "", firstFile);
    },
    [onChange],
  );

  if (!isClient) {
    return (
      <div className="space-y-2">
        <span id={photoLabelId} className="block text-sm font-medium text-gray-700">
          Profile Photo
        </span>
        <div className="w-42.5 h-42.5 mx-auto flex items-center justify-center bg-gray-100 rounded-full">
          <span className="text-gray-400">Loading...</span>
        </div>
        {errors && errors.length > 0 && <p className="text-sm text-red-600">{errors[0]}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span id={photoLabelId} className="block text-sm font-medium text-gray-700">
        Profile Photo
      </span>
      <div className="w-42.5 h-42.5 mx-auto custom-filepond-bg">
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore - FilePond types are incomplete */}
        <FilePond
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          files={files}
          onupdatefiles={handleUpdateFiles}
          allowMultiple={false}
          maxFiles={1}
          name="photo"
          labelIdle='Drag & Drop your photo or <span class="filepond--label-action">Browse</span>'
          acceptedFileTypes={["image/png", "image/jpeg", "image/jpg"]}
          imagePreviewHeight={170}
          stylePanelLayout="compact circle"
          styleLoadIndicatorPosition="center bottom"
          styleButtonRemoveItemPosition="center bottom"
        />
      </div>
      {errors && errors.length > 0 && <p className="text-sm text-red-600">{errors[0]}</p>}
    </div>
  );
}
