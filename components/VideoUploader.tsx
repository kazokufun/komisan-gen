

import React, { useCallback, useState, useRef, useEffect } from 'react';

interface VideoUploaderProps {
    onVideoChange: (file: File | null) => void;
    previewUrl: string | null;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-light-text-secondary dark:text-dark-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const TrashIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoChange, previewUrl }) => {
    const [isDragging, setIsDragging] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // When the previewUrl changes, we might need to reload the video element.
        // This is especially true if the same file object is selected again
        // after being removed.
        if (previewUrl && videoRef.current) {
            videoRef.current.load();
        }
    }, [previewUrl]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('video/')) {
                onVideoChange(file);
            } else {
                alert("Please drop a video file.");
            }
            e.dataTransfer.clearData();
        }
    }, [onVideoChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
             const file = e.target.files[0];
            if (file.type.startsWith('video/')) {
                onVideoChange(file);
            } else {
                alert("Please select a video file.");
            }
        }
    };
    
    const handleRemoveVideo = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // Prevent form submission
        e.stopPropagation(); // Prevent the dropzone click event
        onVideoChange(null);
    };

    const dropzoneClasses = `
        relative group w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200
        ${isDragging ? 'border-brand-blue bg-sky-100 dark:bg-blue-900/30' : 'border-light-accent dark:border-dark-surface hover:border-brand-blue dark:hover:border-brand-blue'}
        ${previewUrl ? 'border-solid p-2' : 'p-4'}
    `;
    
    const inputId = 'video-upload-input';

    return (
        <div>
            <label className="text-lg font-semibold text-light-text-primary dark:text-dark-text mb-2 block">
                Video Input
            </label>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !previewUrl && document.getElementById(inputId)?.click()}
                className={dropzoneClasses}
            >
                <input
                    type="file"
                    id={inputId}
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {previewUrl ? (
                    <div className='relative'>
                        <video ref={videoRef} controls className="mx-auto max-h-60 rounded-md" >
                            <source src={previewUrl} />
                            Your browser does not support the video tag.
                        </video>
                         <button 
                            onClick={handleRemoveVideo}
                            className="absolute top-2 right-2 flex items-center bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Remove video"
                         >
                            <TrashIcon/>
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon />
                        <p className="text-light-text-secondary dark:text-dark-accent">
                            <span className="font-semibold text-brand-blue">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-accent mt-1">MP4, MOV, WEBM, etc.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUploader;