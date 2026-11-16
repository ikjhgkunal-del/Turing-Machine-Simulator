import { useEffect, useRef, useState } from 'react';
import { presets, copyDefinition } from '../data/presets.js';
import { initializeMachine, isTerminal, resetMachine, stepMachine, validateDefinition, validateInput } from '../engine/turingMachine.js';

/** The only timer owner. Every change, navigation, pause, reset, or unmount cancels it. */
export function useMachine(view) {
  const [definition, setDefinition] = useState(() => copyDefinition(presets[0]));
  const [draft, setDraft] = useState(() => copyDefinition(presets[0]));
  const [configuration, setConfiguration] = useState(() => initializeMachine(presets[0], presets[0].example));
  const [input, setInputState] = useState(presets[0].example);
  const [issues, setIssues] = useState([]);
  const [speed, setSpeedState] = useState(450);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const runningRef = useRef(false);
  const dirtyDefinition = JSON.stringify(definition) !== JSON.stringify(draft);
  const dirtyInput = input !== configuration.input;
  const dirty = dirtyDefinition || dirtyInput;

  function pause() {
    runningRef.current = false;
    clearTimeout(timer.current);
    setRunning(false);
    setConfiguration((current) => current.status === 'running' ? { ...current, status: 'paused' } : current);
  }

  useEffect(() => {
    if (view !== 'lab' || !running || isTerminal(configuration)) {
      runningRef.current = false;
      setRunning(false);
      setConfiguration((current) => current.status === 'running' ? { ...current, status: 'paused' } : current);
      return;
    }
    timer.current = setTimeout(() => {
      if (!runningRef.current) return;
      setConfiguration((current) => {
        if (!runningRef.current) return current;
        const next = stepMachine(definition, current);
        return isTerminal(next) ? next : { ...next, status: 'running' };
      });
    }, speed);
    return () => clearTimeout(timer.current);
  }, [view, running, configuration, definition, speed]);

  useEffect(() => () => { runningRef.current = false; clearTimeout(timer.current); }, []);

  function changeDraft(next) { pause(); setDraft(next); setIssues([]); }
  function setInput(value) { pause(); setInputState(value); setIssues([]); }
  function setSpeed(value) { clearTimeout(timer.current); setSpeedState(Number(value)); }
  function loadPreset(id) {
    pause();
    const preset = presets.find((item) => item.id === id);
    setDefinition(copyDefinition(preset)); setDraft(copyDefinition(preset));
    setInputState(preset.example); setConfiguration(initializeMachine(preset, preset.example)); setIssues([]);
  }
  function applyDefinition() {
    pause();
    const validation = validateDefinition(draft);
    const errors = [...validation.errors, ...(validation.valid ? validateInput(draft, input).errors : [])];
    setIssues(errors);
    if (errors.length) return;
    const next = copyDefinition(draft);
    setDefinition(next); setConfiguration(initializeMachine(next, input));
  }
  function loadInput() {
    pause();
    const validation = validateInput(definition, input);
    setIssues(validation.errors);
    if (validation.valid) setConfiguration(initializeMachine(definition, input));
  }
  function reset() { pause(); setInputState(configuration.input); setConfiguration((current) => resetMachine(definition, current)); setIssues([]); }
  function step() {
    if (dirty || issues.length || running) return;
    setConfiguration((current) => stepMachine(definition, current));
  }
  function run() {
    if (dirty || issues.length || isTerminal(configuration) || running) return;
    runningRef.current = true; setRunning(true);
    setConfiguration((current) => ({ ...current, status: 'running' }));
  }
  return { definition, draft, configuration, input, issues, speed, running, dirty, dirtyInput, dirtyDefinition,
    changeDraft, setInput, setSpeed, loadPreset, applyDefinition, loadInput, reset, step, run, pause };
}
