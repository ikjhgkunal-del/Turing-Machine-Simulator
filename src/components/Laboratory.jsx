import { useState } from 'react';
import { presets } from '../data/presets.js';
import { DEFAULT_STEP_LIMIT, isTerminal, STATUS_LABELS, readCell } from '../engine/turingMachine.js';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import TapeView from './TapeView.jsx';
import StateDiagram from './StateDiagram.jsx';
import TraceTable from './TraceTable.jsx';
import TransitionEditor from './TransitionEditor.jsx';

export default function Laboratory({ machine, onHome, onResults }) {
  const [help, setHelp] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const { definition, draft, configuration, input, issues, speed, running, dirty, dirtyDefinition } = machine;
  const terminal = isTerminal(configuration);
  const blocked = terminal || dirty || issues.length > 0;
  const inputErrors = issues.filter((issue) => issue.field === 'input');
  const status = issues.length ? 'error' : configuration.status;
  const last = configuration.lastTransition;
  const preset = presets.find((item) => item.id === definition.id);
  const customized = JSON.stringify(definition) !== JSON.stringify(preset);
  return <main className="lab-page page-enter">
    <header className="lab-header">
      <button className="brand-small" onClick={onHome} aria-label="Project Enigma home"><span className="brand-rule">E</span><span>PROJECT ENIGMA<small>THE COMPUTATION LABORATORY</small></span></button>
      <div className="lab-header-actions"><button className="text-button" onClick={onHome}><Icon name="back" size={16} /> Home</button><button className="text-button" onClick={() => { machine.pause(); setHelp(true); }}><Icon name="help" size={17} /> Field guide</button></div>
    </header>
    <div className="lab-intro"><div><span className="eyebrow">BLETCHLEY PARK / THEORETICAL COMPUTATION</span><h1 tabIndex="-1">Turing Machine Laboratory<span>.</span></h1><p>A tape. A head. A finite set of rules. Follow the idea, one step at a time.</p></div><span className="case-number">LAB<br /><strong>01</strong></span></div>
    <div className="preset-bar"><label className="preset-select"><span className="eyebrow">EXPERIMENT</span><select aria-label="Machine preset" value={definition.id} onChange={(event) => { machine.loadPreset(event.target.value); setEditorKey((value) => value + 1); }}>{presets.map((item, index) => <option value={item.id} key={item.id}>{String(index + 1).padStart(2, '0')} — {item.name}</option>)}</select></label><span className="preset-note">{customized ? 'CUSTOM RULES APPLIED' : 'DETERMINISTIC · SINGLE TAPE'}</span><button className="text-button" onClick={machine.reset}><Icon name="reset" size={16} /> Reset</button></div>
    <div className="lab-grid">
      <div className="execution-column">
        <section className="panel simulation-panel" aria-labelledby="tape-title">
          <div className="section-heading"><div><span className="eyebrow">01 / OBSERVE</span><h2 id="tape-title">The infinite tape</h2></div><span className={`status status-${status}`} role="status" aria-live="polite"><span className="status-dot" />{STATUS_LABELS[status]}</span></div>
          <p className="experiment-description">{definition.description}</p>
          <form className="input-form" onSubmit={(event) => { event.preventDefault(); machine.loadInput(); }}>
            <label className="field"><span>Input tape <small>Σ = {'{'}{definition.inputAlphabet.join(', ')}{'}'}</small></span><input aria-label="Input tape" value={input} onChange={(event) => machine.setInput(event.target.value)} autoComplete="off" spellCheck="false" placeholder="Empty input is valid" aria-invalid={inputErrors.length > 0} aria-describedby="input-feedback" /></label>
            <button className="button" type="submit">Load input <Icon name="arrow" size={15} /></button>
          </form>
          <div id="input-feedback" className={`input-feedback ${inputErrors.length ? 'field-error' : 'muted'}`} aria-live="polite">{inputErrors.length ? inputErrors.map((error) => error.message).join(' ') : machine.dirtyInput ? 'Input changed. Load it before stepping.' : configuration.input === '' ? 'Empty input loaded. The head begins on a blank cell.' : `${Array.from(configuration.input).length} symbols loaded. ${definition.hint}`}</div>
          <TapeView definition={definition} configuration={configuration} />
          <div className="machine-metrics"><div><span className="eyebrow">CURRENT STATE</span><strong data-testid="current-state">{configuration.state}</strong></div><div><span className="eyebrow">TRANSITIONS</span><strong data-testid="step-count">{String(configuration.steps).padStart(3, '0')}</strong></div><div className="last-transition"><span className="eyebrow">{last ? 'LAST TRANSITION' : 'UP NEXT'}</span><code>{last ? `${last.from} / ${last.read} → ${last.write}, ${last.move} / ${last.to}` : `δ(${configuration.state}, ${readCell(definition, configuration)})`}</code></div></div>
          <div className="sim-controls"><div className="control-buttons"><button className="button" disabled={blocked || running} onClick={machine.step}><Icon name="step" size={16} /> Step</button><button className="button primary" disabled={blocked || running} onClick={machine.run}><Icon name="play" size={15} /> Run</button><button className="button" disabled={!running} onClick={machine.pause}><Icon name="pause" size={15} /> Pause</button><button className="icon-button reset-control" aria-label="Reset tape" onClick={machine.reset}><Icon name="reset" /></button></div><label className="speed-control"><span>Speed</span><select aria-label="Execution speed" value={speed} onChange={(event) => machine.setSpeed(event.target.value)}><option value="900">Slow · 0.9s</option><option value="450">Normal · 0.45s</option><option value="100">Fast · 0.1s</option><option value="10">Demo · 0.01s</option></select></label></div>
          {dirtyDefinition && <p className="inline-note">Rules changed. Apply the definition to use your edits.</p>}
          {terminal && <div className={`outcome-strip outcome-${configuration.status}`}><div><strong>{STATUS_LABELS[configuration.status]}</strong><p>{configuration.message || (configuration.status === 'accepted' ? 'The machine entered its accepting state.' : 'The machine entered its rejecting state.')}</p></div><button className="button" onClick={onResults}>Review results <Icon name="arrow" size={16} /></button></div>}
          <p className="safety-note">L = left · R = right · S = stay <span>{DEFAULT_STEP_LIMIT.toLocaleString()} transition safety limit</span></p>
        </section>
        <section className="panel graph-panel" aria-labelledby="diagram-title"><div className="section-heading"><div><span className="eyebrow">03 / FOLLOW</span><h2 id="diagram-title">State map</h2></div><span className="small muted">{definition.states.length} states · {definition.transitions.length} rules</span></div><StateDiagram definition={definition} configuration={configuration} /></section>
      </div>
      <TransitionEditor draft={draft} onChange={machine.changeDraft} onApply={machine.applyDefinition} dirty={dirtyDefinition} issues={issues} editorKey={editorKey} />
      <section className="panel trace-panel" aria-labelledby="trace-title"><div className="section-heading"><div><span className="eyebrow">04 / RECORD</span><h2 id="trace-title">Execution trace</h2></div><span className="small muted">{configuration.trace.length} transitions recorded</span></div><TraceTable trace={configuration.trace} /></section>
    </div>
    <footer className="lab-footer"><span>CSET302 · AUTOMATA THEORY & COMPUTABILITY</span><span>A formal Turing machine. Historical setting dramatized.</span></footer>
    {help && <Modal title="A small guide to the machine" onClose={() => setHelp(false)}><ol className="guide-list"><li><strong>Choose an experiment.</strong> The binary machine accepts strings ending in 1. The crib exercise rejects any S.</li><li><strong>Load an input.</strong> Use only symbols in Σ. Empty input starts on a blank.</li><li><strong>Step, or Run.</strong> Each transition reads, writes, moves the head, and changes state. Pause stops the timer.</li><li><strong>Make it yours.</strong> Edit the states, alphabets, or rules. Apply definition validates and resets the tape.</li><li><strong>Review the result.</strong> Acceptance, rejection, no-rule halt, and the safety limit are separate outcomes. Reset retries the same loaded input.</li></ol><p className="theory-note">Enigma was a rotor cipher. The Bombe and a formal Turing machine are different devices. This lab models computation; it does not decrypt Enigma.</p></Modal>}
  </main>;
}
