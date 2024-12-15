// frontend/src/components/PDFTextViewer.js
import React from 'react';
import '../styles/pdfViewer.css';

const PDFTextViewer = ({ content }) => {
  if (!content) {
    return <div>No content available</div>;
  }

  const processContent = (text) => {
    // Split content into logical sections based on line breaks and content type
    const sections = text.split(/\n(?=(?:[A-Z][A-Za-z\s,]+|[0-9]+\.|\([a-z]\)|\*))/);

    return sections.map((section, index) => {
      // Check if section is a header (all caps or contains "OFFER LETTER", "Annexure", etc.)
      if (isHeader(section)) {
        return (
          <h2 key={`header-${index}`} className="pdf-header">
            {section.trim()}
          </h2>
        );
      }

      // Check if section is a table (compensation details)
      if (isCompensationTable(section)) {
        return processCompensationTable(section, index);
      }

      // Check if section is address block
      if (isAddressBlock(section)) {
        return (
          <div key={`address-${index}`} className="pdf-address">
            {section.split('\n').map((line, i) => (
              <div key={i}>{line.trim()}</div>
            ))}
          </div>
        );
      }

      // Check if section is a date
      if (isDate(section)) {
        return (
          <div key={`date-${index}`} className="pdf-date">
            {section.trim()}
          </div>
        );
      }

      // Check if section starts with "Dear"
      if (section.trim().startsWith('Dear')) {
        return (
          <div key={`salutation-${index}`} className="pdf-salutation">
            {section.trim()}
          </div>
        );
      }

      // Regular paragraphs with proper spacing
      return (
        <div key={`section-${index}`} className="pdf-section">
          {section.split('\n').map((line, i) => (
            <p key={i} className={line.trim() ? 'pdf-paragraph' : 'pdf-spacing'}>
              {line.trim()}
            </p>
          ))}
        </div>
      );
    });
  };

  const isHeader = (text) => {
    const headerPatterns = [
      /OFFER LETTER/i,
      /Annexure/i,
      /^[A-Z\s]{5,}$/m // Five or more consecutive capital letters
    ];
    return headerPatterns.some(pattern => pattern.test(text.trim()));
  };

  const isCompensationTable = (text) => {
    return text.includes('Compensation') && text.includes('Per Month') && text.includes('Per Annual');
  };

  const isAddressBlock = (text) => {
    return text.includes('Plot No.') && text.includes('Sector') && text.includes('Gurugram');
  };

  const isDate = (text) => {
    return /^\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s+\d{4}/.test(text.trim());
  };

  const processCompensationTable = (text, index) => {
    const rows = text.split('\n')
      .filter(row => row.trim())
      .map(row => {
        const [description, monthly, annual] = row.split(/\s+(?=\d+,\d+)|\s+(?=\d+$)/);
        return { description, monthly, annual };
      });

    return (
      <div key={`table-${index}`} className="pdf-compensation-table">
        <h3>Compensation Details</h3>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Per Month (INR)</th>
              <th>Per Annum (INR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.description}</td>
                <td>{row.monthly}</td>
                <td>{row.annual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="pdf-content">
      {processContent(content)}
    </div>
  );
};

export default PDFTextViewer;