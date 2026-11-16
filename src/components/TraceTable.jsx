import { useEffect, useRef } from 'react';

export default function TraceTable({ trace, expanded = false }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [trace.length]);
  return <div className={`trace-scroll ${expanded ? 'trace-expanded' : ''}`} ref={scrollRef} tabIndex={0} aria-label="Execution trace, scroll to review transitions">
    <table className="trace-table">
      <caption className="sr-only">One row for each executed Turing machine transition. Head is the position after moving.</caption>
      <thead><tr><th scope="col">Step</th><th scope="col">State before</th><th scope="col">Read</th><th scope="col">Write</th><th scope="col">Move</th><th scope="col">State after</th><th scope="col">Head</th></tr></thead>
      <tbody>{trace.length ? trace.map((row) => <tr key={row.step}>
        <td>{String(row.step).padStart(2, '0')}</td><td>{row.from}</td><td>{row.read}</td><td>{row.write}</td>
        <td><span title={{ L: 'Left', R: 'Right', S: 'Stay' }[row.move]}>{row.move} <span className="muted">{{ L: '←', R: '→', S: '·' }[row.move]}</span></span></td>
        <td>{row.to}</td><td>{row.head}</td>
      </tr>) : <tr><td colSpan="7" className="empty-trace">Your first step starts the record. Nothing has been executed yet.</td></tr>}</tbody>
    </table>
  </div>;
}
