import React, { useState } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';

const EditMode = ({ initialContent, onSave }) => {
  const [editor] = useState(() => withReact(createEditor()));
  const [content, setContent] = useState(initialContent);

  return (
    <Slate editor={editor} value={content} onChange={setContent}>
      <Editable className="bg-white text-black p-4 rounded-lg shadow-lg overflow-auto" />
      <button onClick={() => onSave(content)} className="mt-2 p-2 bg-blue-500 text-white rounded">
        Save
      </button>
    </Slate>
  );
};

export default EditMode; 