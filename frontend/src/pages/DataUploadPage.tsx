import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { dataAPI } from '../services/apiService';

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
            setMessage(error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to upload data. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="py-8 space-y-8">
            <div>
                <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
                    Import Data
                </h1>
                <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d] mt-1">
                    Upload a CSV to populate products, inventory, suppliers, and orders in one go.
                </p>
            </div>

            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8">
                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput')?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                        flex flex-col items-center justify-center gap-4 cursor-pointer
                        ${isDragging
                            ? 'border-[#0071e3] bg-[#0071e3]/5 dark:bg-blue-900/10'
                            : 'border-[#d2d2d7] dark:border-[#38383a] hover:border-[#86868b] dark:hover:border-[#636366]'
                        }
                    `}
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
                            <Upload className="w-8 h-8 text-[#86868b] dark:text-[#98989d]" />
                        )}
                    </div>

                    {file ? (
                        <div>
                            <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">{file.name}</h3>
                            <p className="text-[#86868b] dark:text-[#98989d] text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Drop CSV file here</h3>
                            <p className="text-[#86868b] dark:text-[#98989d] text-sm mt-1">or click to browse</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-2">
                            Product Category (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Electronics"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] dark:placeholder-[#636366] border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
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
                                    ? 'bg-[#d2d2d7] dark:bg-[#3a3a3c] cursor-not-allowed'
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

                {/* Expected Format */}
                <div className="mt-6 p-4 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e]">
                    <p className="text-sm font-medium text-[#1d1d1f] dark:text-white mb-2">Required CSV columns:</p>
                    <p className="text-sm text-[#86868b] dark:text-[#98989d]">
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Product Name</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Unit Cost</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Selling Price</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Current Stock</code>
                    </p>
                    <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">
                        Inventory: <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Category</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Warehouse</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Min Stock</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Max Stock</code>
                    </p>
                    <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">
                        Suppliers: <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Supplier</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Reliability</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Lead Time</code>
                    </p>
                    <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">
                        Shipments: <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Shipment Expected</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Shipment Actual</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Shipment Cost</code>
                    </p>
                    <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">
                        Orders: <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Order Qty</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Order Date</code>,{' '}
                        <code className="bg-[#e8e8ed] dark:bg-[#3a3a3c] px-1.5 py-0.5 rounded">Region</code>
                    </p>
                </div>

                {/* Status Messages */}
                {message && (
                    <div className={`
                        mt-8 p-4 rounded-xl flex items-start gap-3
                        ${uploadStatus === 'success'
                            ? 'bg-[#34c759]/10 text-[#34c759]'
                            : uploadStatus === 'error'
                                ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                                : 'bg-[#0071e3]/10 text-[#0071e3]'
                        }
                    `}>
                        {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                        {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        {uploadStatus === 'idle' && isUploading && <Loader className="w-5 h-5 flex-shrink-0 animate-spin" />}
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                {/* Results Stats */}
                {stats && uploadStatus === 'success' && (
                    <div className="mt-8 pt-8 border-t border-[#d2d2d7] dark:border-[#38383a]">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-6">Processing Results</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Products</p>
                                <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">{(stats.stats?.products_created || 0) + (stats.stats?.products_updated || 0)}</p>
                            </div>
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Suppliers</p>
                                <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">{(stats.stats?.suppliers_created || 0) + (stats.stats?.suppliers_updated || 0)}</p>
                            </div>
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Shipments</p>
                                <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">{stats.stats?.shipments_created || 0}</p>
                            </div>
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Orders</p>
                                <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">{stats.stats?.orders_created || 0}</p>
                            </div>
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Inventory Records</p>
                                <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white mt-1">{stats.stats?.inventory_records_updated || 0}</p>
                            </div>
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Predictions</p>
                                <p className="text-2xl font-bold text-[#0071e3] mt-1">{stats.analysis?.predictions_generated || 0}</p>
                            </div>
                            <div className="p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                                <p className="text-sm text-[#86868b] dark:text-[#98989d]">Insights</p>
                                <p className="text-2xl font-bold text-[#34c759] mt-1">{stats.analysis?.insights_generated || 0}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataUploadPage;
