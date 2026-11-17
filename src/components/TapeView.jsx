import { readCell } from '../engine/turingMachine.js';

export default function TapeView({ definition, configuration }) {
  const { head, lastTransition } = configuration;
  const positions = Array.from({ length: 11 }, (_, index) => head + index - 5);
  return <div className="tape-region" aria-label={`Tape. Head at cell ${head}, reading ${readCell(definition, configuration)}.`}>
    <div className="tape-edge-label"><span>← INFINITE TAPE</span><span>INFINITE TAPE →</span></div>
    <div className="tape-viewport"><div key={configuration.steps} className={`tape-strip ${lastTransition ? 'tape-in-motion' : ''}`} style={{ '--tape-offset': lastTransition?.move === 'R' ? '9.09%' : lastTransition?.move === 'L' ? '-9.09%' : '0%' }}>
      {positions.map((position) => <div key={position} className={`tape-column ${position === head ? 'active-cell' : ''} ${lastTransition?.headBefore === position ? 'written-cell' : ''}`}>
        <span className="cell-index">{position}</span>
        <div className="tape-cell" aria-current={position === head ? 'true' : undefined}>{readCell(definition, configuration, position)}</div>
        {position === head && <span className="head-marker">▲<span>HEAD</span></span>}
      </div>)}
    </div></div>
    <p className="tape-caption">Blank = <code>{definition.blank}</code><span>Cell <strong>{head}</strong> · Reading <strong>{readCell(definition, configuration)}</strong></span></p>
  </div>;
}
