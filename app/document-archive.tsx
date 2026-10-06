import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentArchiveItem {
  id: string;
  yearLabel: string;
  dotColor: string;
  isExpanded: boolean;
  summaryText?: string;
  card?: {
    tagDate: string;
    title: string;
    details: string;
  };
  fileNote?: string;
}

const initialItems: DocumentArchiveItem[] = [
  {
    id: '2018',
    yearLabel: '2018 - Pre Surgery',
    dotColor: '#ea9124',
    isExpanded: true,
    summaryText: 'Pre-operative trauma evaluation and initial emergency radiology scans.',
    card: {
      tagDate: 'MRI · 11/06/2019',
      title: 'Paranasal sinuses',
      details: 'Paranasal sinuses, Nasal septum, Right inferior turbinate',
    }
  },
  {
    id: '2019',
    yearLabel: '2019 - Post Surgery',
    dotColor: '#c44a42',
    isExpanded: false,
  },
  {
    id: '2020',
    yearLabel: '2020',
    dotColor: '#c44a42',
    isExpanded: true,
    summaryText: 'Annual monitoring scans and chronic pain rehabilitation documentation.',
    fileNote: 'Historical record indexed (23 files). No 3D model mapped.',
  },
  {
    id: '2021',
    yearLabel: '2021',
    dotColor: '#3a7d6d',
    isExpanded: false,
  }
];

interface DocumentArchiveProps {
  selectedYear?: string | null;
  onSelectYear?: (yearId: string | null) => void;
}

export function DocumentArchive({ selectedYear, onSelectYear }: DocumentArchiveProps = {}) {
  const [items, setItems] = useState<DocumentArchiveItem[]>(initialItems);
  const [isOpen, setIsOpen] = useState(true);

  const toggleExpand = (id: string) => {
    const isCurrentlyExpanded = items.find(item => item.id === id)?.isExpanded;
    setItems(items.map(item => item.id === id ? { ...item, isExpanded: !item.isExpanded } : item));
    if (onSelectYear) {
      if (selectedYear === id) {
        onSelectYear(null);
      } else {
        onSelectYear(id);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="fixed left-8 top-[180px] z-30 bg-white/95 backdrop-blur-xl border border-[#18253610] rounded-[14px] shadow-[0_2px_6px_#1825360a] px-3 py-6 flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
        onClick={() => setIsOpen(true)}
        title="Expand Document Archive"
        aria-label="Expand Document Archive"
      >
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[#5a6875] font-bold text-[11px] tracking-[.06em] uppercase">Document Archive</div>
      </button>
    );
  }

  return (
    <section className="fixed left-8 top-[180px] z-30 w-[290px] h-auto max-h-[calc(100dvh-280px)] flex flex-col bg-[#fdfdfd] backdrop-blur-xl border border-[#18253610] rounded-[14px] shadow-[0_15px_70px_#2433440a] overflow-hidden text-[#263b48]" aria-label="Document Archive">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <h2 className="text-[#5a6875] font-bold text-[11px] tracking-[.06em] uppercase">Document Archive</h2>
        <Button 
          variant="ghost" 
          className="w-6 h-6 p-0 rounded-full hover:bg-[#1825360f]" 
          onClick={() => setIsOpen(false)}
          title="Collapse panel"
          aria-label="Collapse panel"
        >
          <ChevronLeft size={14} className="text-[#65717e]" strokeWidth={2.5} />
        </Button>
      </div>

      {/* Content List */}
      <div className="overflow-y-auto flex-1 px-3 pb-4 flex flex-col gap-2 custom-scrollbar">
        {items.map((item) => {
          const isSelected = selectedYear === item.id;
          return (
          <div key={item.id} className={`flex flex-col border rounded-xl bg-[#ffffff] shadow-[0_2px_6px_#1825360a] overflow-hidden transition-colors ${isSelected ? 'border-[#3a7d6d] ring-1 ring-[#3a7d6d]/40' : 'border-[#18253610]'}`}>
            
            {/* Card Header / Toggle Button */}
            <button 
              className={`flex items-center gap-2.5 w-full p-3 focus:outline-none transition-colors ${isSelected ? 'bg-[#3a7d6d]/5 hover:bg-[#3a7d6d]/10' : 'hover:bg-[#18253606]'}`}
              onClick={() => toggleExpand(item.id)}
            >
              <div className="flex items-center justify-center text-[#65717e]">
                {item.isExpanded ? <ChevronDown size={13} strokeWidth={2.5} /> : <ChevronRight size={13} strokeWidth={2.5} />}
              </div>
              <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: item.dotColor }} />
              <span className="text-[11px] font-semibold text-[#202e3b] leading-[1.25]">{item.yearLabel}</span>
            </button>
            
            {/* Expanded Inner Content */}
            {item.isExpanded && (
              <div className="px-3 pb-3 pt-0 flex flex-col gap-3">
                
                {/* Summary Text */}
                {item.summaryText && (
                  <p className="text-[10px] text-[#5a6875] leading-[1.35] pl-6 pr-1">
                    {item.summaryText}
                  </p>
                )}
                
                {/* Record Card */}
                {item.card && (
                  <div className="border border-[#18253610] rounded-lg p-2.5 bg-[#ffffff] shadow-[0_2px_6px_#1825360a] ml-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-[#5a6875] tracking-[.02em] uppercase">{item.card.tagDate}</span>
                      <button className="text-[#65717e] hover:text-[#1e293b] transition-colors" title="Edit" aria-label="Edit">
                        <Pencil size={11} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="text-[11px] font-semibold text-[#202e3b] leading-[1.25] mb-[2px]">{item.card.title}</div>
                    <div className="text-[9.5px] text-[#788694] leading-[1.2]">{item.card.details}</div>
                  </div>
                )}

                {/* File Note */}
                {item.fileNote && (
                  <div className="flex items-start gap-2 bg-[#18253606] p-2 rounded-lg ml-6 border border-[#18253610]">
                    <FileText size={12} className="text-[#65717e] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="text-[9.5px] text-[#788694] leading-[1.2]">
                      {item.fileNote}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
