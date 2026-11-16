/**
 * A deterministic, single-tape Turing machine. No React, timers, or I/O.
 * Symbols are single Unicode code points; cell indices may be negative.
 * @typedef {{from:string, read:string, write:string, move:'L'|'R'|'S', to:string}} Rule
 * @typedef {{states:string[], inputAlphabet:string[], tapeAlphabet:string[], blank:string,
 * startState:string, acceptState:string, rejectState:string, transitions:Rule[]}} Definition
 * @typedef {{tape:Map<number,string>, head:number, state:string, steps:number, input:string,
 * status:string, trace:object[], lastTransition:object|null, message:string}} Configuration
 */

export const DEFAULT_STEP_LIMIT = 1000;
export const TERMINAL_STATUSES = new Set(['accepted', 'rejected', 'halted-no-rule', 'step-limit', 'error']);
export const STATUS_LABELS = {
  ready: 'Ready', running: 'Running', paused: 'Paused', accepted: 'Accepted',
  rejected: 'Rejected', 'halted-no-rule': 'Halted (no transition)',
  'step-limit': 'Step limit reached', error: 'Error',
};
export const isTerminal = (configuration) => TERMINAL_STATUSES.has(configuration.status);
const isSymbol = (value) => typeof value === 'string' && Array.from(value).length === 1 && !/\s/u.test(value);

/** Return actionable issues with field paths, without throwing on malformed data. */
export function validateDefinition(definition) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  if (!definition || typeof definition !== 'object') {
    return { valid: false, errors: [{ field: 'definition', message: 'Enter a machine definition.' }] };
  }
  const list = (field, symbols = false, allowEmpty = false) => {
    const values = definition[field];
    if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) {
      add(field, `Enter ${allowEmpty ? 'a list of' : 'at least one'} ${symbols ? 'symbol' : 'state'}${allowEmpty ? 's' : ''}.`);
      return [];
    }
    if (values.some((value) => symbols ? !isSymbol(value) : typeof value !== 'string' || !value.trim() || value !== value.trim())) {
      add(field, symbols ? 'Each symbol must be one character, with no spaces.' : 'State names must be nonempty and have no surrounding spaces.');
    }
    if (new Set(values).size !== values.length) add(field, `Remove repeated ${symbols ? 'symbols' : 'state names'}.`);
    return values;
  };
  const states = list('states');
  const input = list('inputAlphabet', true, true);
  const tape = list('tapeAlphabet', true);
  if (!isSymbol(definition.blank) || !tape.includes(definition.blank)) {
    add('blank', 'The blank must be one character in the tape alphabet.');
  }
  if (input.includes(definition.blank)) add('inputAlphabet', 'The input alphabet must not contain the blank symbol.');
  if (input.some((symbol) => !tape.includes(symbol))) add('inputAlphabet', 'Every input symbol must also be in the tape alphabet.');
  for (const field of ['startState', 'acceptState', 'rejectState']) {
    if (!states.includes(definition[field])) add(field, 'Choose a state that is in the states list.');
  }
  if (definition.acceptState === definition.rejectState) add('rejectState', 'Accept and reject states must be different.');
  if (!Array.isArray(definition.transitions)) {
    add('transitions', 'Transitions must be a list of rules.');
  } else {
    const keys = new Set();
    definition.transitions.forEach((rule, index) => {
      const path = `transitions.${index}`;
      if (!rule || typeof rule !== 'object') { add(path, 'Complete this transition rule.'); return; }
      if (!states.includes(rule.from)) add(`${path}.from`, 'The source state is not in the states list.');
      if (!states.includes(rule.to)) add(`${path}.to`, 'The target state is not in the states list.');
      if (!tape.includes(rule.read)) add(`${path}.read`, 'The read symbol must be in the tape alphabet.');
      if (!tape.includes(rule.write)) add(`${path}.write`, 'The write symbol must be in the tape alphabet.');
      if (!['L', 'R', 'S'].includes(rule.move)) add(`${path}.move`, 'Choose L (left), R (right), or S (stay).');
      if ([definition.acceptState, definition.rejectState].includes(rule.from)) add(`${path}.from`, 'Halting states cannot have outgoing transitions.');
      const key = JSON.stringify([rule.from, rule.read]);
      if (keys.has(key)) add(path, 'Two rules are defined for the same state and read symbol.');
      keys.add(key);
    });
  }
  return { valid: errors.length === 0, errors };
}

export function validateInput(definition, input) {
  if (typeof input !== 'string') return { valid: false, errors: [{ field: 'input', message: 'Enter a text input, or leave it empty.' }] };
  const invalid = [...new Set(Array.from(input))].filter((symbol) => symbol === definition.blank || !definition.inputAlphabet.includes(symbol));
  const errors = invalid.map((symbol) => ({ field: 'input', message: symbol === definition.blank
    ? `The blank symbol ‘${symbol}’ belongs on the tape, not in the input.`
    : `Input contains ‘${symbol}’, which is not in the input alphabet.` }));
  return { valid: errors.length === 0, errors };
}

const haltingStatus = (definition, state) => state === definition.acceptState ? 'accepted' : state === definition.rejectState ? 'rejected' : null;

/** Validate and create an initial, independent configuration. Empty input is valid. */
export function initializeMachine(definition, input = '') {
  const validation = validateDefinition(definition);
  if (!validation.valid) throw new Error(validation.errors.map((error) => error.message).join(' '));
  const inputValidation = validateInput(definition, input);
  if (!inputValidation.valid) throw new Error(inputValidation.errors.map((error) => error.message).join(' '));
  return {
    tape: new Map(Array.from(input, (symbol, index) => [index, symbol])),
    head: 0, state: definition.startState, steps: 0, input,
    status: haltingStatus(definition, definition.startState) || 'ready',
    trace: [], lastTransition: null, message: '',
  };
}

export const readCell = (definition, configuration, position = configuration.head) => configuration.tape.get(position) ?? definition.blank;

/** Exactly one transition. Previous maps, rows and configurations remain unchanged. */
export function stepMachine(definition, configuration, maxSteps = DEFAULT_STEP_LIMIT) {
  if (isTerminal(configuration)) return configuration;
  const halt = haltingStatus(definition, configuration.state);
  if (halt) return { ...configuration, status: halt };
  if (configuration.steps >= maxSteps) return { ...configuration, status: 'step-limit', message: 'Execution paused at the safety limit. This machine may not halt.' };
  const read = readCell(definition, configuration);
  const rule = definition.transitions.find((candidate) => candidate.from === configuration.state && candidate.read === read);
  if (!rule) return { ...configuration, status: 'halted-no-rule', message: 'Machine halted: no transition is defined for this state and symbol.' };
  const tape = new Map(configuration.tape);
  if (rule.write === definition.blank) tape.delete(configuration.head);
  else tape.set(configuration.head, rule.write);
  const head = configuration.head + ({ L: -1, R: 1, S: 0 }[rule.move]);
  const steps = configuration.steps + 1;
  const row = { step: steps, from: configuration.state, read, write: rule.write, move: rule.move, to: rule.to, headBefore: configuration.head, head };
  const status = haltingStatus(definition, rule.to) || (steps >= maxSteps ? 'step-limit' : 'paused');
  return {
    ...configuration, tape, head, steps, state: rule.to, status,
    trace: [...configuration.trace, row], lastTransition: row,
    message: status === 'step-limit' ? 'Execution paused at the safety limit. This machine may not halt.' : '',
  };
}

/** Synchronous bounded runner for tests and consumers outside React. The UI uses a timer. */
export function runWithLimit(definition, configuration, maxSteps = DEFAULT_STEP_LIMIT) {
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) throw new Error('The step limit must be a positive integer.');
  let current = configuration;
  while (!isTerminal(current)) current = stepMachine(definition, current, maxSteps);
  return current;
}

export const resetMachine = (definition, configuration) => initializeMachine(definition, configuration.input);

/** Preserve blanks between nonblank cells, and omit only blank outer margins. */
export function tapeContent(definition, configuration) {
  const indices = [...configuration.tape.keys()].sort((a, b) => a - b);
  if (!indices.length) return '';
  let text = '';
  for (let position = indices[0]; position <= indices[indices.length - 1]; position++) text += readCell(definition, configuration, position);
  return text;
}
