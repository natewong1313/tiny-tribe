"use client";

import { Suspense, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { FilePondFile } from "filepond";

import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "./filepond-custom.css";

interface FilePondUploadProps {
  photoLabelId: string;
  onChange: (fileName: string, file: File | null) => void;
  errors?: string[];
}

// Dynamically import FilePond with SSR disabled (needs browser APIs)
const FilePond = dynamic(() => import("react-filepond").then((mod) => mod.FilePond), {
  ssr: false,
  loading: () => (
    <div className="w-42.5 h-42.5 mx-auto flex items-center justify-center bg-gray-100 rounded-full">
      <span className="text-gray-400">Loading...</span>
    </div>
  ),
});

// Register plugins at module level for client with parallel imports
if (typeof window !== "undefined") {
  Promise.all([
    import("filepond-plugin-image-exif-orientation"),
    import("filepond-plugin-image-preview"),
  ]).then(([exif, preview]) => {
    const { registerPlugin } = require("react-filepond");
    registerPlugin(exif.default, preview.default);
  });
}

function FilePondUploadContent({ photoLabelId, onChange, errors }: FilePondUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleUpdateFiles = useCallback(
    (fileItems: FilePondFile[]) => {
      const newFiles = fileItems
        .map((fileItem) => fileItem.file)
        .filter((file): file is File => file !== null);
      setFiles(newFiles);
      const firstFile = newFiles[0] ?? null;
      onChange(firstFile?.name ?? "", firstFile);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <span id={photoLabelId} className="block text-sm font-medium text-gray-700">
        Profile Photo
      </span>
      <div className="w-42.5 h-42.5 mx-auto custom-filepond-bg">
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore - FilePond types are incomplete */}
        <FilePond
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

export function FilePondUpload(props: FilePondUploadProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">Profile Photo</span>
          <div className="w-42.5 h-42.5 mx-auto flex items-center justify-center bg-gray-100 rounded-full">
            <span className="text-gray-400">Loading...</span>
          </div>
          {props.errors && props.errors.length > 0 && (
            <p className="text-sm text-red-600">{props.errors[0]}</p>
          )}
        </div>
      }
    >
      <FilePondUploadContent {...props} />
    </Suspense>
  );
}
