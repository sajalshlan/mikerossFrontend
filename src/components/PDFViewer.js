import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfDomViewer = ({ fileUrl, onLoad }) => {
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const renderTextContent = async () => {
      try {
        const pdf = await pdfjs.getDocument(fileUrl).promise;
        setNumPages(pdf.numPages);

        console.log(pdf.numPages);
        
        const page = await pdf.getPage(currentPage);
        const textContent = await page.getTextContent();

        console.log(textContent);
        const viewport = page.getViewport({ scale: 1.5 });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        const textLayer = document.createElement('div');
        textLayer.className = 'textLayer';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        // Group text items by their vertical position (same line)
        const lineMap = new Map();
        textContent.items.forEach((textItem) => {
          const y = Math.round(textItem.transform[5]); // Round to handle small differences
          if (!lineMap.has(y)) {
            lineMap.set(y, []);
          }
          lineMap.get(y).push(textItem);
        });

        // Sort lines by vertical position (top to bottom)
        const sortedLines = Array.from(lineMap.entries()).sort((a, b) => b[0] - a[0]);

        // Create paragraph elements for each line
        sortedLines.forEach(([y, items]) => {
          // Sort items within line by horizontal position
          items.sort((a, b) => a.transform[4] - b.transform[4]);
          
          const lineElement = document.createElement('div');
          lineElement.className = 'pdf-line';
          
          items.forEach((textItem) => {
            const tx = pdfjs.Util.transform(viewport.transform, textItem.transform);
            const fontSize = Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1]));
            
            const textElement = document.createElement('span');
            textElement.textContent = textItem.str;
            textElement.className = 'pdf-text';
            textElement.style.fontSize = `${fontSize * 1.5}px`;
            textElement.style.marginLeft = `${textItem.width ? textItem.width / 4 : 0}px`;
            
            lineElement.appendChild(textElement);
          });

          textLayer.appendChild(lineElement);
        });

        containerRef.current.appendChild(textLayer);
        if (onLoad) onLoad();

      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    renderTextContent();
  }, [fileUrl, currentPage, onLoad]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef} 
        className="w-full min-h-[800px] bg-white shadow-lg rounded-lg p-4 overflow-auto"
      >
        <style>
          {`
            .textLayer {
              opacity: 1;
              line-height: 1.6;
              -webkit-font-smoothing: subpixel-antialiased;
            }
            .pdf-line {
              margin: 0.5em 0;
              display: flex;
              flex-wrap: wrap;
              align-items: baseline;
            }
            .pdf-text {
              color: black;
              white-space: pre;
              cursor: text;
              margin-right: 2px;
            }
            .pdf-text::selection {
              background: rgba(0, 0, 255, 0.2);
            }
          `}
        </style>
      </div>
      {numPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
            disabled={currentPage === numPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfDomViewer;