"use client";

import React, { useCallback, useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import { useDropzone } from "react-dropzone";
import {
  uploadFilesChunked,
  type UploadedMediaResult,
} from "@/lib/chunked-media-upload";

type Props = {
  folder?: string;
  onUploaded?: (results: UploadedMediaResult[]) => void;
};

const DropzoneComponent: React.FC<Props> = ({
  folder = "general",
  onUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<UploadedMediaResult[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        const results = await uploadFilesChunked(
          acceptedFiles,
          folder,
          (_index, total, fileProgress) => {
            setProgress(((_index + fileProgress) / total) * 100);
          },
        );
        setLastResults(results);
        onUploaded?.(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload gagal");
      } finally {
        setUploading(false);
      }
    },
    [folder, onUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
      "application/pdf": [],
    },
  });

  return (
    <ComponentCard title="Dropzone">
      {uploading && (
        <div className="mb-4">
          <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
            Mengunggah… {Math.round(progress)}%
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      {lastResults.length > 0 && !uploading && (
        <ul className="mb-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {lastResults.map((item) => (
            <li key={item.path} className="truncate">
              ✓ {item.url ?? item.path}
            </li>
          ))}
        </ul>
      )}

      <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
        <form
          {...getRootProps()}
          className={`dropzone rounded-xl border-dashed border-gray-300 p-7 lg:p-10
        ${
          isDragActive
            ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        }
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
          id="demo-upload"
        >
          <input {...getInputProps()} />

          <div className="dz-message flex flex-col items-center m-0!">
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
            </div>

            <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
              {uploading
                ? "Uploading…"
                : isDragActive
                  ? "Drop Files Here"
                  : "Drag & Drop Files Here"}
            </h4>

            <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
              PNG, JPG, WebP, SVG, PDF — chunked upload ke R2
            </span>

            <span className="font-medium underline text-theme-sm text-brand-500">
              Browse File
            </span>
          </div>
        </form>
      </div>
    </ComponentCard>
  );
};

export default DropzoneComponent;
