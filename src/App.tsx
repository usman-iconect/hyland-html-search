import { useState, useRef, useMemo } from 'react';
import './App.css';
import Mark from 'mark.js';

function App() {

  const [file, setFile] = useState(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  //very important to keep it in useMemo, otherwise it will keep creating new iframe on every render and remove all the highlight spans we added
  const htmlIFrame = useMemo(() => file && <iframe ref={iframeRef} id='html-file' title='html-file' style={{ width: '70%', height: '100%' }} src={URL.createObjectURL(file)} />, [file]);
  function onUpload(e: any) {
    setFile(e.target.files[0]);
  }

  function onSearch() {

    const searchInput = document.getElementById('input-text') as HTMLInputElement;
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      return;
    };
    if (!iframeRef.current) {
      console.log("returning at current")
      return;
    };

    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;

    if (!iframeDoc) {
      console.log("returning at doc")
      return;
    };

    // Remove existing highlights
    const existingHighlights = iframeDoc.querySelectorAll('.highlight');
    existingHighlights.forEach((highlight) => {
      const text = highlight.textContent;
      if (text) {
        const textNode = document.createTextNode(text);
        highlight.parentNode?.replaceChild(textNode, highlight);
      }
    });

    console.log("Starting Search ", new Date().toLocaleTimeString())

    //hyland puts everything in a div
    const elements = iframeDoc.getElementsByTagName('html');

    const instance = new Mark(elements[0]);
    instance.unmark();
    instance.mark(searchTerm, {
      className: `custom-highlight :::${JSON.stringify({id: Math.random().toString(), text: "some data"})}`,
    });

    setTimeout(() => {
      const highlights = elements[0].getElementsByClassName('custom-highlight')
      for (let i = 0; i < highlights.length; i++) {
        const highlight = highlights[i];
        highlight.addEventListener('click', (e: any) => {
          console.log("clicked", JSON.parse(e.target.className.split(':::')[1]))
        })
      }
      console.log("Ending Search ", new Date().toLocaleTimeString())
      console.log("Highlighted ", highlights.length)
    }, 0)

  }

  return (
    <div className="App">
      {file ?
        <div style={{ display: 'flex', width: '100%', height: '100%', gap: '16px' }}>
          {htmlIFrame}
          <div>
            <input id='input-text' type='text' placeholder='Search Text' />
            <button onClick={onSearch}>Search</button>
          </div>
        </div> :
        <input type="file" accept=".html" onChange={onUpload} />}
    </div>
  );
}

export default App;
