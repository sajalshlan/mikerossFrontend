export const searchInDocument = (searchText) => {
    try {
      // Clean up the search text
      let cleanedText = searchText
        .split(/\.{3,}|…/)[0]        // Take only the part before ... or …
        .trim();                     // Remove any trailing space
      
      // Remove ordinal indicators only when they follow a number
      cleanedText = cleanedText.replace(/(\d+)(?:st|nd|rd|th)\b.*$/, '$1');
      
      // Create variations of the search text
      const searchVariations = [
        cleanedText,                    // Original cleaned text
        cleanedText.toUpperCase(),      // ALL CAPS version
      ];
      
      // Find the file preview container
      const filePreview = document.querySelector('.file-preview-container');
      if (!filePreview) return false;
  
      // Try each variation until we find a match
      for (const searchVariation of searchVariations) {
        // Create a text node walker to find the text
        const walker = document.createTreeWalker(
          filePreview,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(node) {
              return node.textContent.includes(searchVariation) ? 
                NodeFilter.FILTER_ACCEPT : 
                NodeFilter.FILTER_REJECT;
            }
          }
        );
  
        // Find the first matching node
        const node = walker.nextNode();
        if (node) {
          // Create a range around the matching text
          const range = document.createRange();
          const startIndex = node.textContent.indexOf(searchVariation);
          range.setStart(node, startIndex);
          range.setEnd(node, startIndex + searchVariation.length);
  
          // Clear any existing selection
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
  
          // Add temporary highlight with enhanced styling
          const span = document.createElement('span');
          span.className = 'temp-highlight';
          range.surroundContents(span);
  
          // Scroll the matched text into view
          setTimeout(() => {
            span.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }, 100);
  
          // Remove highlight element after animation completes
          setTimeout(() => {
            const parent = span.parentNode;
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
          }, 5000);
  
          return true;
        }
      }
  
      return false;
    } catch (error) {
      console.error('Error during search:', error);
      return false;
    }
  };