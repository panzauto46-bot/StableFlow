import React, { useState, useRef } from 'react';
import {
    X,
    Camera,
    Upload,
    Receipt,
    MapPin,
    DollarSign,
    FileText,
    Tag,
    ChevronDown,
    Check,
    AlertCircle,
    Image as ImageIcon,
} from 'lucide-react';
import { ExpenseCategory, ExpenseCategoryLabels, validateExpenseRequest, createExpenseRequest } from '../models/ExpenseRequest';
import { firebaseService } from '../services/FirebaseService';

interface SubmitExpenseModalProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const SubmitExpenseModal: React.FC<SubmitExpenseModalProps> = ({
    userId,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory | ''>('');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(['File harus berupa gambar']);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(['Ukuran gambar maksimal 5MB']);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setReceiptImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setErrors(['Geolocation tidak didukung oleh browser']);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // In production, use Google Maps Geocoding API
                setLocation({
                    lat: latitude,
                    lng: longitude,
                    address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                setErrors(['Gagal mendapatkan lokasi']);
            }
        );
    };

    const handleSubmit = async () => {
        setErrors([]);

        // Create expense object for validation
        const expenseData = {
            title,
            description,
            amount: parseFloat(amount) || 0,
            category: category as ExpenseCategory,
        };

        // Validate
        const validation = validateExpenseRequest(expenseData);
        if (!validation.valid) {
            setErrors(validation.errors);
            return;
        }

        setIsSubmitting(true);

        try {
            // Submit to Firebase
            const result = await firebaseService.submitExpense({
                userId,
                title,
                description,
                amount: parseFloat(amount),
                currency: 'USDC',
                category: category as ExpenseCategory,
                status: 'PENDING',
                receiptUrl: receiptImage || undefined,
                notes: location ? `Lokasi: ${location.address}` : undefined,
            });

            if (result.success) {
                setShowSuccess(true);

                // Reset form after 2 seconds
                setTimeout(() => {
                    setShowSuccess(false);
                    setTitle('');
                    setDescription('');
                    setAmount('');
                    setCategory('');
                    setReceiptImage(null);
                    setLocation(null);
                    onSuccess?.();
                    onClose();
                }, 2000);
            } else {
                setErrors([result.error || 'Gagal mengajukan klaim']);
            }
        } catch (error: any) {
            setErrors([error.message]);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Berhasil!</h3>
                    <p className="text-white/60">Klaim biaya Anda telah diajukan dan menunggu persetujuan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
            <div className="glass rounded-t-3xl md:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#0a1628]/95 backdrop-blur-xl px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-white font-bold text-lg">Ajukan Klaim Baru</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Error Messages */}
                    {errors.length > 0 && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    {errors.map((error, index) => (
                                        <p key={index} className="text-red-400 text-sm">{error}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="text-white/60 text-sm mb-2 block">Judul Klaim *</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4a940]" />
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Perjalanan Dinas Jakarta"
                                className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-white/60 text-sm mb-2 block">Deskripsi *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Jelaskan detail pengeluaran..."
                            rows={3}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] resize-none transition-colors"
                        />
                    </div>

                    {/* Amount & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-white/60 text-sm mb-2 block">Jumlah (USDC) *</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4a940]" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-white/60 text-sm mb-2 block">Kategori *</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    className="w-full py-4 px-4 bg-white/5 border border-white/10 rounded-xl text-left flex items-center justify-between hover:border-[#d4a940] focus:border-[#d4a940] outline-none transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Tag className="w-5 h-5 text-[#d4a940]" />
                                        <span className={category ? 'text-white' : 'text-white/40'}>
                                            {category ? ExpenseCategoryLabels[category] : 'Pilih'}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showCategoryDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#142038] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                                        {(Object.keys(ExpenseCategoryLabels) as ExpenseCategory[]).map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    setCategory(cat);
                                                    setShowCategoryDropdown(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between
                          ${category === cat ? 'bg-[#d4a940]/10 text-[#d4a940]' : 'text-white/70'}`}
                                            >
                                                {ExpenseCategoryLabels[cat]}
                                                {category === cat && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Receipt Upload */}
                    <div>
                        <label className="text-white/60 text-sm mb-2 block">Foto Struk/Bukti (Opsional)</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        {receiptImage ? (
                            <div className="relative">
                                <img
                                    src={receiptImage}
                                    alt="Receipt"
                                    className="w-full h-48 object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setReceiptImage(null)}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-6 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[#d4a940]/50 transition-colors"
                                >
                                    <Camera className="w-8 h-8 text-[#d4a940]" />
                                    <span className="text-white/60 text-sm">Ambil Foto</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-6 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[#d4a940]/50 transition-colors"
                                >
                                    <Upload className="w-8 h-8 text-[#d4a940]" />
                                    <span className="text-white/60 text-sm">Unggah File</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-white/60 text-sm mb-2 block">Lokasi Pengeluaran (Opsional)</label>
                        {location ? (
                            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <MapPin className="w-5 h-5 text-[#d4a940]" />
                                <span className="text-white/70 flex-1 text-sm">{location.address}</span>
                                <button
                                    type="button"
                                    onClick={() => setLocation(null)}
                                    className="text-white/40 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
                            >
                                <MapPin className="w-5 h-5 text-[#d4a940]" />
                                <span className="text-white/60">Tambahkan Lokasi Saat Ini</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#0a1628]/95 backdrop-blur-xl px-6 py-4 border-t border-white/10">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-[#d4a940] to-[#f5d77e] text-[#0a1628] font-bold rounded-xl shadow-lg shadow-[#d4a940]/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" />
                                <span>Mengajukan...</span>
                            </>
                        ) : (
                            <>
                                <Receipt className="w-5 h-5" />
                                <span>Ajukan Klaim</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitExpenseModal;
