import { useState, useCallback } from 'react';
import { useConfiguratorStore, LanyardLogoItem } from '../../store/useConfiguratorStore';
import { Upload, X, FileImage, Crop, Plus, Sliders } from 'lucide-react';
import LanyardImageCropModal from './LanyardImageCropModal';
import { toast } from 'sonner';

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file?: File;
}

const BORDER_COLORS = [
  '#ffffff', '#fde68a', '#d1d5db', '#94a3b8',
  '#f87171', '#fb923c', '#a78bfa', '#22d3ee',
  '#111827',
];

export default function UploadPanel({
  onAddLogo,
  lanyardLogosCount = 0,
  maxLogos = 6
}: {
  onAddLogo?: (url: string, name?: string) => void;
  lanyardLogosCount?: number;
  maxLogos?: number;
}) {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);

  const [images, setImages] = useState<UploadedImage[]>([
    {
      id: 'default-logo-1',
      name: 'Sample Logo',
      url: '/gotek-logo.png'
    }
  ]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropModalImage, setCropModalImage] = useState<string | null>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    fileArr.forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newImg = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          url,
          file,
        };
        setImages(prev => [newImg, ...prev]);

        // Auto-add newly uploaded image if limit not reached
        if (onAddLogo) {
          if (lanyardLogosCount < maxLogos) {
            onAddLogo(url, file.name);
            toast.success(`Uploaded & added "${file.name}" to lanyard!`);
          } else {
            toast.warning(`Uploaded "${file.name}". Maximum ${maxLogos} images reached on lanyard.`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, [onAddLogo, lanyardLogosCount, maxLogos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  }, [processFiles]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const isMaxReached = lanyardLogosCount >= maxLogos;
  const showImageSettings = lanyardLogosCount > 0 || (design.lanyardLogos && design.lanyardLogos.length > 0) || Boolean(design.logoUrl);

  const updateLogoSetting = (field: string, value: any) => {
    setField(field, value);

    if (field === 'logoMode') {
      setField('logoRepeat', value === 'repeated');
    }

    // Sync to lanyardLogos array items if present
    const logos = design.lanyardLogos;
    if (logos && logos.length > 0) {
      const fieldToItemKey: Record<string, keyof LanyardLogoItem> = {
        logoScale: 'scale',
        logoRotation: 'rotation',
        logoBorderWidth: 'borderWidth',
        logoBorderColor: 'borderColor',
        logoBorderRadius: 'borderRadius',
        logoOpacity: 'opacity',
      };
      const itemKey = fieldToItemKey[field];
      if (itemKey) {
        const updated = logos.map(logo => ({
          ...logo,
          [itemKey]: value,
        }));
        setField('lanyardLogos', updated);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
            <Upload size={14} className="text-indigo-600" />
            Upload Assets
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            isMaxReached ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'
          }`}>
            {lanyardLogosCount}/{maxLogos} ADDED
          </span>
        </div>
        <p className="text-[10px] text-slate-400">Click "+ Add" to insert an image onto the lanyard</p>
      </div>

      {/* Drop Zone */}
      <div className="px-4 mb-4">
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center py-5 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50 scale-[0.99]'
              : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
          onClick={() => document.getElementById('lanyard-file-input')?.click()}
        >
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center mb-1.5 text-indigo-600">
            <Upload size={18} />
          </div>
          <p className="text-xs font-bold text-slate-700 mb-0.5">Click or drag images to upload</p>
          <p className="text-[10px] text-slate-400">PNG, JPG, SVG up to 10MB</p>
          <input
            id="lanyard-file-input"
            type="file"
            accept="image/*,.svg"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* Uploaded Images List */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Available Images ({images.length})
        </h4>
        <span className="text-[9px] text-slate-400">Limit: {maxLogos} max</span>
      </div>

      <div className="px-4 pb-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
            <FileImage size={32} className="text-slate-300 mb-2" />
            <p className="text-[11px] font-bold text-slate-500">No uploaded images yet</p>
            <p className="text-[10px] text-slate-400">Upload your logo to place it on the lanyard</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {images.map(img => {
              return (
                <div
                  key={img.id}
                  className="group relative flex items-center gap-3 p-2 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm rounded-xl transition-all"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      if (isMaxReached) {
                        toast.error(`Maximum limit of ${maxLogos} images reached on lanyard!`);
                        return;
                      }
                      onAddLogo?.(img.url, img.name);
                      toast.success(`Added "${img.name}" to lanyard!`);
                    }}
                    className="w-14 h-14 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center p-1 cursor-pointer relative"
                    title="Click to Add"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info & Actions */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate mb-1.5">{img.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* ADD BUTTON */}
                      <button
                        onClick={() => {
                          if (isMaxReached) {
                            toast.error(`Maximum limit of ${maxLogos} images reached on lanyard!`);
                            return;
                          }
                          onAddLogo?.(img.url, img.name);
                          toast.success(`Added "${img.name}" to lanyard!`);
                        }}
                        disabled={isMaxReached}
                        className={`px-3 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1 transition-all ${
                          isMaxReached
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95'
                        }`}
                      >
                        <Plus size={11} />
                        Add to Lanyard
                      </button>

                      <button
                        onClick={() => setCropModalImage(img.url)}
                        className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md flex items-center gap-1 transition-all"
                        title="Crop & Edit"
                      >
                        <Crop size={10} />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Remove from Uploads */}
                  <button
                    onClick={() => removeImage(img.id)}
                    className="w-6 h-6 shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Uploaded Asset"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* IMAGE SETTINGS SECTION */}
      {showImageSettings && (
        <div className="border-t border-slate-200 pt-4">
          {/* Section Header */}
          <div className="px-4 mb-3">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={13} className="text-indigo-600" />
              IMAGE SETTINGS
            </h3>
          </div>

          {/* Image Scale */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Image Scale</h4>
              <span className="text-[11px] font-bold text-indigo-600">{(design.logoScale ?? 1).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={3}
              step={0.1}
              value={design.logoScale ?? 1}
              onChange={e => updateLogoSetting('logoScale', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Image Rotation */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Image Rotation</h4>
              <span className="text-[11px] font-bold text-indigo-600">{design.logoRotation ?? 0}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={design.logoRotation ?? 0}
              onChange={e => updateLogoSetting('logoRotation', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Image Repeat Spacing */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Image Repeat Spacing</h4>
              <span className="text-[11px] font-bold text-indigo-600">{design.logoSpacing ?? 40}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              value={design.logoSpacing ?? 40}
              onChange={e => updateLogoSetting('logoSpacing', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Image Pattern Placement */}
          <div className="px-4 mb-4">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Image Pattern Placement</h4>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => updateLogoSetting('logoMode', 'repeated')}
                className={`flex-1 py-2 text-[11px] font-bold rounded-md transition-all ${
                  (design.logoMode ?? 'repeated') === 'repeated'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Repeated Loop
              </button>
              <button
                type="button"
                onClick={() => updateLogoSetting('logoMode', 'single')}
                className={`flex-1 py-2 text-[11px] font-bold rounded-md transition-all ${
                  design.logoMode === 'single'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Single Center
              </button>
            </div>
          </div>

          {/* Border Width */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Border Width</h4>
              <span className="text-[11px] font-bold text-indigo-600">{design.logoBorderWidth ?? 0}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={design.logoBorderWidth ?? 0}
              onChange={e => updateLogoSetting('logoBorderWidth', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Border Color */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Border Color</h4>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {(design.logoBorderColor || '#ffffff').toUpperCase()}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap mb-2.5">
              {BORDER_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateLogoSetting('logoBorderColor', color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    (design.logoBorderColor || '#ffffff').toLowerCase() === color.toLowerCase()
                      ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={design.logoBorderColor || '#ffffff'}
                onChange={e => updateLogoSetting('logoBorderColor', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={design.logoBorderColor || '#ffffff'}
                onChange={e => updateLogoSetting('logoBorderColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1 px-3 py-1.5 text-xs font-mono font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Border Radius</h4>
              <span className="text-[11px] font-bold text-indigo-600">{design.logoBorderRadius ?? 0}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={design.logoBorderRadius ?? 0}
              onChange={e => updateLogoSetting('logoBorderRadius', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Image Opacity */}
          <div className="px-4 mb-4 pb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Image Opacity</h4>
              <span className="text-[11px] font-bold text-indigo-600">{Math.round((design.logoOpacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={design.logoOpacity ?? 1}
              onChange={e => updateLogoSetting('logoOpacity', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropModalImage && (
        <LanyardImageCropModal
          isOpen={!!cropModalImage}
          onClose={() => setCropModalImage(null)}
          imageUrl={cropModalImage}
          onSave={(croppedUrl) => {
            if (onAddLogo) {
              onAddLogo(croppedUrl, 'Cropped Image');
              toast.success('Cropped image added to lanyard!');
            }
          }}
        />
      )}
    </div>
  );
}
