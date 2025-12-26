'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ThreeDBookProps {
  coverImage: string;
}

export const ThreeDBook: React.FC<ThreeDBookProps> = ({ coverImage }) => {
  return (
    <div className="relative w-[280px] md:w-[350px] aspect-[2/3] perspective-1000 group">
      <motion.div
        initial={{ rotateY: 30, rotateX: 10 }}
        animate={{ rotateY: -15, rotateX: 5 }}
        whileHover={{ rotateY: 0, rotateX: 0, scale: 1.05, transition: { duration: 0.5, ease: "easeOut" } }}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* Front Cover */}
        <div className="absolute inset-0 z-20 backface-hidden shadow-2xl rounded-r-md" style={{ transform: 'translateZ(25px)' }}>
            <div className="relative w-full h-full rounded-r-md overflow-hidden bg-[#1a1a1a]">
                <Image
                    src={coverImage}
                    fill
                    alt="Book Cover"
                    className="object-cover"
                    priority
                />
                 {/* Spine Highlight/Crease */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/10 z-30"></div>
                <div className="absolute left-[2px] top-0 bottom-0 w-[1px] bg-black/20 z-30"></div>
                
                {/* Gloss/Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" />
            </div>
        </div>

        {/* Book Spine */}
        <div 
            className="absolute left-0 top-0 bottom-0 w-[50px] bg-[#111] z-10" 
            style={{ 
                transform: 'rotateY(-90deg) translateZ(25px)', 
                transformOrigin: 'left center' 
            }}
        >
            <div className="w-full h-full relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 border-l border-white/5">
                 {/* Spine Text (Optional - Vertical) */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary/40 font-garamond font-bold tracking-widest text-xs rotate-90 whitespace-nowrap opacity-80">
                        NATURE OF THE DIVINE
                    </span>
                 </div>
            </div>
        </div>

        {/* Pages (Side) */}
        <div 
            className="absolute right-0 top-[3px] bottom-[3px] w-[48px] bg-[#FDFBF7]"
            style={{ 
                transform: 'rotateY(90deg) translateZ(23px)', /* 50/2 - inset */
                transformOrigin: 'right center'
            }}
        >
            {/* Page Textures */}
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#FDFBF7,#FDFBF7_1px,#eee_2px,#eee_3px)] shadow-inner"></div>
        </div>

        {/* Back Cover (Usually not visible but good for 360 effects) */}
        <div 
            className="absolute inset-0 bg-[#1a1a1a] rounded-l-md"
            style={{ transform: 'rotateY(180deg) translateZ(25px)' }}
        ></div>

        {/* Shadow */}
        <div 
            className="absolute -bottom-12 left-4 right-4 h-8 bg-black/40 blur-xl rounded-[50%]"
            style={{ transform: 'rotateX(90deg) translateZ(-50px)' }}
        ></div>

      </motion.div>
    </div>
  );
};
