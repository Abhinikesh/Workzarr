import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  X, ZoomIn, ZoomOut, Download, 
  Maximize, FileText, ImageIcon 
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Image and Document previewer with lightbox capability
 */
const ImagePreview = ({ src, alt = 'Preview', type = 'image' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const isPdf = type === 'pdf' || src?.toLowerCase().endsWith('.pdf');

  if (!src) return (
    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
      <ImageIcon size={20} />
    </div>
  );

  return (
    <>
      <div 
        className="relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer group bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
        onClick={() => setIsOpen(true)}
      >
        {isPdf ? (
          <div className="w-full h-full flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10">
            <FileText size={20} />
          </div>
        ) : (
          <img src={src} alt={alt} className="w-full h-full object-cover transition-all group-hover:blur-[1px]" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <Maximize size={16} />
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
           
           <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 -mt-12 flex items-center gap-4">
                 {!isPdf && (
                   <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
                      <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors">
                         <ZoomOut size={18} />
                      </button>
                      <span className="text-[10px] font-bold text-white px-2 w-10 text-center">{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors">
                         <ZoomIn size={18} />
                      </button>
                   </div>
                 )}
                 <a 
                   href={src} 
                   download 
                   target="_blank" 
                   rel="noreferrer"
                   className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-full text-white transition-all"
                 >
                    <Download size={20} />
                 </a>
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="p-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-xl shadow-indigo-600/20 transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent rounded-3xl">
                 {isPdf ? (
                    <iframe 
                      src={`${src}#toolbar=0`} 
                      className="w-full h-[80vh] rounded-2xl border-none bg-white"
                      title="PDF Preview"
                    />
                 ) : (
                    <img 
                      src={src} 
                      alt={alt} 
                      className="max-w-full max-h-[80vh] object-contain transition-transform duration-200 shadow-2xl rounded-lg"
                      style={{ transform: `scale(${zoom})` }}
                    />
                 )}
              </div>
              <p className="text-white/60 text-xs font-bold mt-6 tracking-widest uppercase">{alt}</p>
           </div>
        </div>
      )}
    </>
  );
};

ImagePreview.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  type: PropTypes.oneOf(['image', 'pdf'])
};

export default ImagePreview;
