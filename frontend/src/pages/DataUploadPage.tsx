import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { dataAPI } from '../services/apiService';
import TopBar from '../layouts/TopBar';

const DataUploadPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState<any>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            setUploadStatus('error');
            setMessage('Please upload a valid CSV file.');
            return;
        }
        setFile(selectedFile);
        setUploadStatus('idle');
        setMessage('');
        setStats(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('idle');
        setMessage('Processing data and running ML analysis...');

        const formData = new FormData();
        formData.append('file', file);
        if (category) {
            formData.append('category_filter', category);
        }

        try {
            const response = await dataAPI.uploadData(formData);
            setStats(response.data);
            setUploadStatus('success');
            setMessage('Upload complete! Analysis results are ready.');
        } catch (error: any) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setMessage(error.response?.data?.detail || 'Failed to upload data. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000]">
            <div className="pl-64"> {/* Sidebar offset */}
                <TopBar />

                <main className="max-w-4xl mx-auto p-8 pt-10">
                    <div className="mb-8">
                        <h1 className="text-[40px] font-semibold text-[#1d1d1f] dark:text-white leading-tight">
                            Import Data
                        </h1>
                        <p className="text-xl text-[#86868b] mt-2">
                            Upload CSV files to update inventory and trigger ML analysis.
                        </p>
                    </div>

                    <div
                        className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 shadow-sm transition-all duration-300 animate-fade-in"
                    >
                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
                flex flex-col items-center justify-center gap-4 cursor-pointer
                ${isDragging
                                    ? 'border-[#0071e3] bg-[#0071e3]/5'
                                    : 'border-[#d2d2d7] dark:border-[#38383a] hover:border-[#86868b]'
                                }
              `}
                            onClick={() => document.getElementById('fileInput')?.click()}
                        >
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileChange}
                            />

                            <div className="w-16 h-16 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center mb-2">
                                {file ? (
                                    <FileText className="w-8 h-8 text-[#0071e3]" />
                                ) : (
                                    <Upload className="w-8 h-8 text-[#86868b]" />
                                )}
                            </div>

                            {file ? (
                                <div>
                                    <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">
                                        {file.name}
                                    </h3>
                                    <p className="text-[#86868b] text-sm mt-1">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">
                                        Drop CSV file here
                                    </h3>
                                    <p className="text-[#86868b] text-sm mt-1">
                                        or click to browse
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[#86868b] mb-2">
                                    Product Category (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Electronics"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className={`
                    w-full py-3 px-6 rounded-full font-medium text-white transition-all duration-200
                    flex items-center justify-center gap-2
                    ${!file || isUploading
                                            ? 'bg-[#d2d2d7] cursor-not-allowed'
                                            : 'bg-[#0071e3] hover:bg-[#0077ED] active:scale-95 shadow-lg shadow-[#0071e3]/30'
                                        }
                  `}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        'Upload & Analyze'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {message && (
                            <div
                                className={`
                  mt-8 p-4 rounded-xl flex items-start gap-3 transition-opacity duration-300
                  ${uploadStatus === 'success'
                                        ? 'bg-[#34c759]/10 text-[#34c759]'
                                        : uploadStatus === 'error'
                                            ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                                            : 'bg-[#0071e3]/10 text-[#0071e3]'
                                    }
                `}
                            >
                                {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                                {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                {uploadStatus === 'idle' && isUploading && <Loader className="w-5 h-5 flex-shrink-0 animate-spin" />}

                                <span className="font-medium">{message}</span>
                            </div>
                        )}

                        {/* Results Stats */}
                        {stats && uploadStatus === 'success' && (
                            <div className="mt-8 pt-8 border-t border-[#d2d2d7] dark:border-[#38383a]">
                                <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-6">
                                    Processing Results
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl">
                                        <p className="text-sm text-[#86868b]">Products Created</p>
                                        <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">
                                            {stats.stats?.products_created || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl">
                                        <p className="text-sm text-[#86868b]">Updated</p>
                                        <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">
                                            {stats.stats?.products_updated || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl">
                                        <p className="text-sm text-[#86868b]">Predictions</p>
                                        <p className="text-2xl font-bold text-[#0071e3] mt-1">
                                            {stats.analysis?.predictions_generated || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl">
                                        <p className="text-sm text-[#86868b]">New Insights</p>
                                        <p className="text-2xl font-bold text-[#34c759] mt-1">
                                            {stats.analysis?.insights_generated || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default DataUploadPage;
