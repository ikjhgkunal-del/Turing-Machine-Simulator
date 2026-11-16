import { useEffect, useState } from 'react';
import { useMachine } from './hooks/useMachine.js';
import Home from './components/Home.jsx';
import Story from './components/Story.jsx';
import Laboratory from './components/Laboratory.jsx';
import Results from './components/Results.jsx';
import Modal from './components/Modal.jsx';
import './App.css';

export default function App() {
  const [view, setView] = useState('home');
  const [about, setAbout] = useState(false);
  const machine = useMachine(view);
  const navigate = (next) => { machine.pause(); setView(next); };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = `${view === 'lab' ? 'Laboratory' : view === 'story' ? 'The Story' : view === 'results' ? 'Experiment Results' : 'The Codebreaker Chronicles'} — Project Enigma`;
    document.querySelector('h1')?.focus({ preventScroll: true });
  }, [view]);
  return <>
    {view === 'home' && <Home onBegin={() => navigate('story')} onLab={() => navigate('lab')} onAbout={() => setAbout(true)} />}
    {view === 'story' && <Story onHome={() => navigate('home')} onLab={() => navigate('lab')} />}
    {view === 'lab' && <Laboratory machine={machine} onHome={() => navigate('home')} onResults={() => navigate('results')} />}
    {view === 'results' && <Results machine={machine} onBack={() => navigate('lab')} onRetry={() => { machine.reset(); setView('lab'); }} />}
    {about && <Modal title="The idea behind the intercept" onClose={() => setAbout(false)}><p>England, 1940. A fictionalized Alan Turing invites you into a short story about patterns, ciphers, and computation.</p><p>Begin the four-scene investigation, or go directly to the laboratory. There, you can build and run a real deterministic, single-tape Turing machine. No prior experience needed.</p><p className="theory-note">Enigma was a rotor cipher machine. The wartime Bombe and a formal Turing machine are different devices. Our crib exercise checks one simplified consistency constraint; it does not decrypt messages.</p><p className="small muted">Made for CSET302 · Automata Theory & Computability. Runs entirely on your device. Historical dialogue is dramatized, not quoted.</p></Modal>}
  </>;
}
