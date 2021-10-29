// Displays true = checkMark, false = XMark
const boolGridElement = (bool) => {
    let trueElement = (<svg fill="none" height="24" stroke="#27e359" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><polyline points="20 6 9 17 4 12"/></svg>);
  
    let falseElement = (<svg fill="none" height="24" stroke="#e32734" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>);
    
    return (bool == true ? trueElement : falseElement);
  }
  export default boolGridElement