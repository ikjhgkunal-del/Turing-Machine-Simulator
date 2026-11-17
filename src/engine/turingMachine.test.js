import { describe, it, expect } from 'vitest';
import { presets, copyDefinition } from '../data/presets.js';
import { DEFAULT_STEP_LIMIT, initializeMachine, stepMachine, runWithLimit, resetMachine, readCell, tapeContent, validateDefinition, validateInput } from './turingMachine.js';

const [binary, crib] = presets;
const execute = (definition, input, limit) => runWithLimit(definition, initializeMachine(definition, input), limit);
const custom = (transitions) => ({
  states: ['q0', 'q1', 'yes', 'no'], inputAlphabet: ['0', '1'], tapeAlphabet: ['0', '1', '_'],
  blank: '_', startState: 'q0', acceptState: 'yes', rejectState: 'no', transitions,
});

describe('required presets', () => {
  it.each(presets)('$name has a valid definition', (preset) => expect(validateDefinition(preset).valid).toBe(true));
  it.each([['101', 'accepted', 4], ['100', 'rejected', 4], ['', 'rejected', 1], ['1', 'accepted', 2]])('binary %j → %s', (input, status, steps) => {
    const result = execute(binary, input);
    expect(result.status).toBe(status);
    expect(result.steps).toBe(steps);
    expect(tapeContent(binary, result)).toBe(input);
  });
  it.each([['DDDDD', 'accepted', 6], ['DDSDD', 'rejected', 3], ['', 'accepted', 1]])('crib %j → %s', (input, status, steps) => {
    const result = execute(crib, input);
    expect(result.status).toBe(status);
    expect(result.steps).toBe(steps);
  });
  it('agrees with an independent last-character oracle for every binary string up to length 8', () => {
    for (let length = 0; length <= 8; length++) {
      for (let value = 0; value < 2 ** length; value++) {
        const input = length ? value.toString(2).padStart(length, '0') : '';
        expect(execute(binary, input).status).toBe(input.endsWith('1') ? 'accepted' : 'rejected');
      }
    }
  });
});

describe('formal tape and transition semantics', () => {
  it('writes, moves, changes state, and records exactly one transition without mutating the past', () => {
    const definition = custom([{ from: 'q0', read: '0', write: '1', move: 'R', to: 'q1' }]);
    const initial = initializeMachine(definition, '0');
    const next = stepMachine(definition, initial);
    expect(next.tape.get(0)).toBe('1');
    expect(next.head).toBe(1);
    expect(next.state).toBe('q1');
    expect(next.trace).toEqual([{ step: 1, from: 'q0', read: '0', write: '1', move: 'R', to: 'q1', headBefore: 0, head: 1 }]);
    expect(initial.tape.get(0)).toBe('0');
    expect(initial.trace).toEqual([]);
    expect(initial.steps).toBe(0);
  });
  it('moves left to -1, reads an implicit blank, and writes at a negative index', () => {
    const definition = custom([
      { from: 'q0', read: '0', write: '0', move: 'L', to: 'q1' },
      { from: 'q1', read: '_', write: '1', move: 'S', to: 'yes' },
    ]);
    const left = stepMachine(definition, initializeMachine(definition, '0'));
    expect(left.head).toBe(-1);
    expect(readCell(definition, left)).toBe('_');
    const result = stepMachine(definition, left);
    expect(result.tape.get(-1)).toBe('1');
    expect(result.status).toBe('accepted');
    expect(tapeContent(definition, result)).toBe('10');
  });
  it('S keeps the head in place and blank writes erase sparse cells', () => {
    const definition = custom([{ from: 'q0', read: '0', write: '_', move: 'S', to: 'yes' }]);
    const result = execute(definition, '0');
    expect(result.head).toBe(0);
    expect(result.tape.size).toBe(0);
    expect(readCell(definition, result, -100)).toBe('_');
    expect(readCell(definition, result, 100)).toBe('_');
    expect(tapeContent(definition, result)).toBe('');
  });
  it('retains interior blank symbols in final tape content', () => {
    const definition = custom([]);
    const config = initializeMachine(definition, '101');
    config.tape.delete(1);
    expect(tapeContent(definition, config)).toBe('1_1');
  });
  it('missing rules halt with no transition and no false rejection', () => {
    const definition = custom([]);
    const result = execute(definition, '0');
    expect(result.status).toBe('halted-no-rule');
    expect(result.state).toBe('q0');
    expect(result.steps).toBe(0);
    expect(result.trace).toHaveLength(0);
  });
  it.each(['101', '100'])('cannot step beyond acceptance or rejection for %s', (input) => {
    const result = execute(binary, input);
    expect(stepMachine(binary, result)).toBe(result);
  });
  it('handles a machine initially in an accepting state', () => {
    const definition = { ...custom([]), startState: 'yes' };
    const initial = initializeMachine(definition, '');
    expect(initial.status).toBe('accepted');
    expect(stepMachine(definition, initial).steps).toBe(0);
  });
  it('resets input, tape, head, state, trace and step count independently', () => {
    const result = execute(binary, '101');
    const reset = resetMachine(binary, result);
    expect(reset).toEqual(initializeMachine(binary, '101'));
    expect(reset.tape).not.toBe(result.tape);
  });
  it('safely bounds a nonhalting machine at 1,000 transitions', () => {
    const definition = custom([{ from: 'q0', read: '_', write: '_', move: 'L', to: 'q0' }]);
    const result = execute(definition, '');
    expect(result.status).toBe('step-limit');
    expect(result.steps).toBe(DEFAULT_STEP_LIMIT);
    expect(result.trace).toHaveLength(1000);
    expect(result.head).toBe(-1000);
    expect(stepMachine(definition, result)).toBe(result);
  });
  it('supports a configurable limit and prioritizes a halting state at the boundary', () => {
    expect(execute(binary, '101', 2).status).toBe('step-limit');
    expect(execute(binary, '101', 4).status).toBe('accepted');
    expect(() => execute(binary, '101', Infinity)).toThrow('positive integer');
  });
  it('supports one-code-point Unicode symbols', () => {
    const definition = { ...custom([]), inputAlphabet: ['λ'], tapeAlphabet: ['λ', '□'], blank: '□', transitions: [{ from: 'q0', read: 'λ', write: 'λ', move: 'R', to: 'yes' }] };
    expect(execute(definition, 'λ').status).toBe('accepted');
  });
});

describe('definition and input validation', () => {
  it('rejects duplicate transition keys even when destinations differ', () => {
    const definition = copyDefinition(binary);
    definition.transitions.push({ ...definition.transitions[0], to: 'qReject' });
    expect(validateDefinition(definition).errors.some((error) => error.message.includes('Two rules'))).toBe(true);
    expect(() => initializeMachine(definition, '101')).toThrow('Two rules');
  });
  it('rejects an unknown target state before running', () => {
    const definition = copyDefinition(binary);
    definition.transitions[0].to = 'missing';
    expect(() => initializeMachine(definition, '101')).toThrow('target state');
  });
  it('rejects invalid input and the blank symbol, with actionable messages', () => {
    expect(() => initializeMachine(binary, '10X')).toThrow('Input contains ‘X’');
    expect(validateInput(binary, '_').valid).toBe(false);
    expect(validateInput(binary, '').valid).toBe(true);
    expect(validateInput(binary, ' 1').valid).toBe(false);
  });
  it.each([
    ['states', ['qStart', 'qStart']], ['states', []], ['inputAlphabet', ['_']],
    ['inputAlphabet', ['X']], ['tapeAlphabet', ['00', '_']], ['blank', '?'],
    ['startState', 'missing'], ['acceptState', 'missing'], ['rejectState', 'qAccept'],
    ['transitions', null],
  ])('rejects invalid %s = %j', (field, value) => {
    expect(validateDefinition({ ...copyDefinition(binary), [field]: value }).valid).toBe(false);
  });
  it('rejects invalid moves, read/write symbols and outgoing halting rules', () => {
    const definition = copyDefinition(binary);
    definition.transitions[0] = { from: 'qAccept', read: 'X', write: 'Y', move: 'Z', to: 'qStart' };
    expect(validateDefinition(definition).errors).toHaveLength(4);
  });
  it('handles malformed definitions safely', () => {
    expect(validateDefinition(null).valid).toBe(false);
    expect(validateDefinition({ transitions: [null] }).valid).toBe(false);
  });
  it('applied rule edits change actual execution', () => {
    const definition = copyDefinition(binary);
    definition.transitions.find((rule) => rule.from === 'qLast1' && rule.read === '_').to = 'qReject';
    expect(execute(definition, '101').status).toBe('rejected');
    expect(execute(binary, '101').status).toBe('accepted');
  });
});
