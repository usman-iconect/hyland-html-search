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

    //on click handler
    const debouncedHandleClick = debounce(onHighlightClicked, 10);
    function onHighlightClicked(e: any){
      console.log('Clicked on', e.target.getAttribute("data-custom"));
    }

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

    for (let i = 0; i < elements.length; i++) {
      const divElement = elements[i];
      const textNodes = getTextNodes(divElement);
      textNodes.forEach((textNode) => {
        const text = textNode.nodeValue || '';
        const re = new RegExp(searchTerm, 'gi');
        let match;
        while ((match = re.exec(text)) !== null) {
          const span = iframeDoc.createElement('span');
          const id = Math.random().toString();
          span.className = 'highlight';
          span.id = id;
          span.style.backgroundColor = 'yellow';
          span.setAttribute('data-custom', JSON.stringify({ id, text: match[0] }));
          span.onclick = debouncedHandleClick
          const range = iframeDoc.createRange();
          range.setStart(textNode, match.index);
          range.setEnd(textNode, match.index + match[0].length);
          range.surroundContents(span);
        }
      });
    }

    console.log("Ending Search ", new Date().toLocaleTimeString())
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

function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
          func.apply(context, args);
      }, delay);
  };
}


export default App;
