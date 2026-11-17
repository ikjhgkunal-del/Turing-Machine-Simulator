import { useState } from 'react';
import { dialogue } from '../data/dialogue.js';
import Atmosphere from './Atmosphere.jsx';
import Icon from './Icon.jsx';

export default function Story({ onHome, onLab }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = dialogue[sceneIndex];
  const last = sceneIndex === dialogue.length - 1;
  return <main className="cinematic-page story-page page-enter">
    <Atmosphere />
    <header className="story-header"><button className="brand-small" onClick={onHome}><span className="brand-rule">E</span><span>PROJECT ENIGMA<small>THE CODEBREAKER CHRONICLES</small></span></button><button className="text-button" onClick={onLab}>Skip to laboratory <Icon name="arrow" size={17} /></button></header>
    <section className="story-chapter" key={scene.id}><span className="eyebrow">CHAPTER {String(sceneIndex + 1).padStart(2, '0')} / {scene.kicker}</span><h1 tabIndex="-1">{scene.title}<span>.</span></h1><p>{scene.note}</p><div className="story-progress" aria-label={`Scene ${sceneIndex + 1} of ${dialogue.length}`}>{dialogue.map((item, index) => <span key={item.id} className={index <= sceneIndex ? 'complete' : ''} />)}<small>{String(sceneIndex + 1).padStart(2, '0')} / 04</small></div></section>
    <section className="story-dialogue" aria-labelledby="story-speaker"><span className="speaker-label" id="story-speaker">{scene.speaker.toUpperCase()}</span><p key={scene.id} className="dialogue-text">{scene.text}</p><div className="story-controls"><button className="text-button" disabled={sceneIndex === 0} onClick={() => setSceneIndex((index) => index - 1)}><Icon name="back" size={17} /> Back</button><span className="small muted">A fictionalized educational conversation</span><button className="button primary" onClick={() => last ? onLab() : setSceneIndex((index) => index + 1)}>{last ? 'Enter laboratory' : 'Next'}<Icon name="arrow" size={17} /></button></div></section>
    <footer className="story-footer">Historical setting dramatized for educational purposes.</footer>
  </main>;
}
