import { useState } from 'react';
import Icon from './Icon.jsx';

const parseList = (text) => text.split(',').map((part) => part.trim()).filter(Boolean);

function ListField({ label, field, draft, update, errors, hint }) {
  // Keep text locally so trailing commas remain available while typing.
  const [text, setText] = useState(draft[field].join(', '));
  return <label className="field"><span>{label}</span><input aria-label={label} value={text} onChange={(event) => { setText(event.target.value); update(field, parseList(event.target.value)); }} aria-invalid={errors.length > 0} aria-describedby={`${field}-hint`} />
    <small id={`${field}-hint`} className={errors.length ? 'field-error' : 'muted'}>{errors.length ? errors.map((error) => error.message).join(' ') : hint}</small>
  </label>;
}

export default function TransitionEditor({ draft, onChange, onApply, dirty, issues, editorKey }) {
  const update = (field, value) => onChange({ ...draft, [field]: value });
  const errors = (field) => issues.filter((issue) => issue.field === field);
  const updateRule = (index, field, value) => update('transitions', draft.transitions.map((rule, i) => i === index ? { ...rule, [field]: value } : rule));
  const addRule = () => {
    const state = draft.states.find((item) => ![draft.acceptState, draft.rejectState].includes(item)) || '';
    const symbol = draft.tapeAlphabet[0] || '';
    update('transitions', [...draft.transitions, { from: state, read: symbol, write: symbol, move: 'R', to: state }]);
  };
  return <section className="panel editor-panel" aria-labelledby="editor-title">
    <div className="section-heading"><div><span className="eyebrow">02 / DEFINE</span><h2 id="editor-title">The machine’s rules</h2></div><span className={`tag ${dirty ? 'tag-dirty' : ''}`}>{dirty ? 'UNAPPLIED CHANGES' : 'DEFINITION APPLIED'}</span></div>
    <p className="small muted">Each state and read symbol can have one rule. Edit the lists to add or remove states and symbols.</p>
    <div className="definition-fields">
      <ListField key={`${editorKey}-states`} label="States · Q" field="states" draft={draft} update={update} errors={errors('states')} hint="Comma-separated names; keep the halting states." />
      <div className="alphabet-fields">
        <ListField key={`${editorKey}-input`} label="Input alphabet · Σ" field="inputAlphabet" draft={draft} update={update} errors={errors('inputAlphabet')} hint="One character per symbol, separated by commas." />
        <ListField key={`${editorKey}-tape`} label="Tape alphabet · Γ" field="tapeAlphabet" draft={draft} update={update} errors={errors('tapeAlphabet')} hint="Include every input symbol and the blank." />
      </div>
      <div className="state-fields">
        <label className="field"><span>Blank</span><input aria-label="Blank symbol" value={draft.blank} onChange={(event) => update('blank', event.target.value)} aria-invalid={errors('blank').length > 0} />{errors('blank').map((error, i) => <small className="field-error" key={i}>{error.message}</small>)}</label>
        {[['startState', 'Start'], ['acceptState', 'Accept'], ['rejectState', 'Reject']].map(([field, label]) => <label className="field" key={field}><span>{label}</span><select value={draft[field]} onChange={(event) => update(field, event.target.value)} aria-invalid={errors(field).length > 0}>
          {!draft.states.includes(draft[field]) && <option value={draft[field]}>{draft[field] || 'Choose a state'}</option>}
          {draft.states.map((state, i) => <option key={`${state}-${i}`} value={state}>{state}</option>)}
        </select>{errors(field).map((error, i) => <small className="field-error" key={i}>{error.message}</small>)}</label>)}
      </div>
    </div>
    <div className="rules-heading"><span className="eyebrow">TRANSITION TABLE · δ</span><span className="small muted">L left / R right / S stay</span></div>
    <div className="rules-scroll" tabIndex={0} aria-label="Editable transitions">
      <table className="rules-table"><caption className="sr-only">Editable transition rules</caption><thead><tr><th scope="col">State</th><th scope="col">Read</th><th scope="col">Write</th><th scope="col">Move</th><th scope="col">Next state</th><th scope="col"><span className="sr-only">Delete</span></th></tr></thead>
        <tbody>{draft.transitions.map((rule, index) => {
          const rowIssues = issues.filter((issue) => issue.field === `transitions.${index}` || issue.field.startsWith(`transitions.${index}.`));
          return <tr key={index} className={rowIssues.length ? 'invalid-row' : ''}>
            {['from', 'read', 'write', 'move', 'to'].map((field) => <td key={field}><select aria-label={`Rule ${index + 1} ${field}`} value={rule[field]} onChange={(event) => updateRule(index, field, event.target.value)} aria-invalid={rowIssues.length > 0}>
              {(() => {
                const options = ['from', 'to'].includes(field) ? draft.states : field === 'move' ? ['L', 'R', 'S'] : draft.tapeAlphabet;
                return [...new Set([rule[field], ...options])].map((value) => <option value={value} key={value}>{value || '—'}</option>);
              })()}
            </select>{field === 'from' && rowIssues.length > 0 && <span className="sr-only">{rowIssues.map((issue) => issue.message).join(' ')}</span>}</td>)}
            <td><button className="icon-button" aria-label={`Delete rule ${index + 1}`} onClick={() => update('transitions', draft.transitions.filter((_, i) => i !== index))}><Icon name="delete" size={15} /></button></td>
          </tr>;
        })}</tbody>
      </table>
      {!draft.transitions.length && <p className="empty-rules small muted">No transitions. Add a rule, or apply this machine to demonstrate a no-rule halt.</p>}
    </div>
    <button className="text-button add-rule" onClick={addRule}><Icon name="plus" size={15} /> Add transition</button>
    {issues.filter((issue) => issue.field !== 'input').length > 0 && <div className="validation-errors" role="alert"><strong>Check the definition</strong><ul>{issues.filter((issue) => issue.field !== 'input').map((issue, index) => <li key={index}>{issue.field.startsWith('transitions.') ? `Rule ${Number(issue.field.split('.')[1]) + 1}: ` : ''}{issue.message}</li>)}</ul></div>}
    <div className="editor-bottom"><p className="small muted">Applying restarts the tape with your current input.</p><button className="button primary" onClick={onApply}><Icon name="check" size={16} /> Apply definition</button></div>
  </section>;
}
