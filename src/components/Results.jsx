import { STATUS_LABELS, tapeContent } from '../engine/turingMachine.js';
import Icon from './Icon.jsx';
import TapeView from './TapeView.jsx';
import TraceTable from './TraceTable.jsx';

export default function Results({ machine, onBack, onRetry }) {
  const { definition, configuration } = machine;
  const content = tapeContent(definition, configuration);
  const descriptions = {
    accepted: 'The machine reached its accepting state. The input satisfies the rules you applied.',
    rejected: 'The machine reached its rejecting state. The input does not satisfy the rules you applied.',
    'halted-no-rule': 'Machine halted: no transition is defined for this state and symbol. This is neither acceptance nor rejection.',
    'step-limit': 'Execution paused at the safety limit. This machine may not halt. No accept or reject verdict was reached.',
    error: 'The machine could not continue. Return to the laboratory to check the definition.',
  };
  return <main className="results-page page-enter">
    <header className="results-header"><button className="text-button" onClick={onBack}><Icon name="back" /> Back to lab</button><span className="eyebrow">PROJECT ENIGMA / EXPERIMENT RECORD</span></header>
    <section className="result-summary"><span className="eyebrow">THE COMPUTATION IS COMPLETE</span><span className={`result-symbol ${configuration.status}`} aria-hidden="true">{configuration.status === 'accepted' ? '✓' : configuration.status === 'rejected' ? '×' : '—'}</span><h1 tabIndex="-1">{STATUS_LABELS[configuration.status]}<span>.</span></h1><p>{descriptions[configuration.status]}</p><span className="tag">{definition.name}</span></section>
    <section className="panel result-tape"><div className="result-stats"><div><span className="eyebrow">INITIAL INPUT</span><code>{configuration.input || '(empty input)'}</code></div><div><span className="eyebrow">FINAL TAPE CONTENT</span><code>{content || '(all blank)'}</code></div><div><span className="eyebrow">TRANSITIONS</span><strong>{configuration.steps}</strong></div><div><span className="eyebrow">FINAL STATE</span><code>{configuration.state}</code></div></div><TapeView definition={definition} configuration={configuration} /><p className="small muted result-tape-note">Outer blanks omitted from the content above. Interior blanks are shown as {definition.blank}. The tape below includes context around the final head at cell {configuration.head}.</p></section>
    <div className="result-actions"><button className="button" onClick={onBack}><Icon name="back" size={16} /> Back to lab</button><button className="button primary" onClick={onRetry}><Icon name="reset" size={16} /> Reset & retry</button></div>
    <section className="panel"><div className="section-heading"><div><span className="eyebrow">THE COMPLETE RECORD</span><h2>Every step accounted for</h2></div><span className="small muted">Head position is shown after moving.</span></div><TraceTable trace={configuration.trace} expanded /></section>
    <footer className="lab-footer"><span>READ → WRITE → MOVE → CHANGE STATE</span><span>Computation, made visible.</span></footer>
  </main>;
}
