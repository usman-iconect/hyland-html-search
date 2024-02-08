import { useState, useRef, useMemo } from 'react';
import './App.css';

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
    const searchTerm = searchInput.value;
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

    //hyland puts everything in a div
    const elements = iframeDoc.getElementsByTagName('div');

    console.log("Starting Search ", new Date().toLocaleTimeString())
    let count = 0;
    
    for (let i = 0; i < elements.length; i++) {
      const divElement = elements[i];
      const textNodes = getTextNodes(divElement);
      // eslint-disable-next-line no-loop-func
      textNodes.forEach((textNode) => {
        const text = textNode.nodeValue || '';
        const re = new RegExp(searchTerm, 'gi');
        let match;
        while ((match = re.exec(text)) !== null) {
          if (match.index > 0) {
            //create highlight span
            const span = iframeDoc.createElement('span');
            const id = Math.random().toString();
            span.className = 'highlight';
            span.id = id;
            span.style.backgroundColor = 'yellow';
            span.setAttribute('data-custom', JSON.stringify({ id, text: match[0] }));
            span.onclick = (e : any) => {
              console.log('Clicked on', e.target.getAttribute("data-custom"))
            }

            //insert that on the text node
            try {
              const range = iframeDoc.createRange();
              range.setStart(textNode, match.index);
              range.setEnd(textNode, match.index + match[0].length);
              range.surroundContents(span);
              count++;
            }
            catch (error) {
              // console.log(error);
            }
          }
        }
      });
    }

    console.log("Ending Search ", new Date().toLocaleTimeString())
    console.log("Highlighted ", count)
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


const getTextNodes = (element: Node): Text[] => {
  const textNodes: Text[] = [];
  const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let currentNode = treeWalker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = treeWalker.nextNode();
  }

  return textNodes;
};

export default App;
