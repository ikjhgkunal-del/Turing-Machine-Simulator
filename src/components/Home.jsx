import Atmosphere from './Atmosphere.jsx';
import Icon from './Icon.jsx';

export default function Home({ onBegin, onLab, onAbout }) {
  return <main className="cinematic-page home-page page-enter">
    <Atmosphere />
    <header className="home-header"><div className="home-brand"><span>PROJECT</span><h1 tabIndex="-1">ENIGMA</h1><p>THE CODEBREAKER CHRONICLES</p></div><button className="text-button case-link" onClick={onAbout}><Icon name="book" size={19} /> Case file <span className="case-link-number">/ 001</span></button></header>
    <div className="location-mark"><span className="tiny-rule" /> BLETCHLEY PARK, ENGLAND <span>1940</span></div>
    <nav className="home-nav" aria-label="Main menu"><p className="eyebrow">EVERY PATTERN HAS A BEGINNING.</p>
      <button className="menu-button menu-primary" onClick={onBegin}><Icon name="arrow" size={29} /><span>Begin<br />investigation<small>A SHORT STORY IN FOUR SCENES</small></span></button>
      <button className="menu-button" onClick={onLab}><Icon name="lab" size={26} /><span>Turing Machine<br />Laboratory<small>GO STRAIGHT TO THE SIMULATOR</small></span></button>
      <button className="menu-button menu-secondary" onClick={onAbout}><Icon name="folder" size={25} /><span>Case file<small>THE MISSION & THE THEORY</small></span></button>
    </nav>
    <section className="home-dialogue" aria-label="An introduction from Alan Turing"><span className="speaker-label">ALAN TURING</span><p>We’ve intercepted a message.<br />Your task is to uncover the pattern.</p><span className="dialogue-corner" aria-hidden="true">▾</span></section>
    <aside className="intercept-card" aria-label="A decorative fictional intercept"><span className="intercept-stamp">INTERCEPTED</span><p>ZQFJ MVXQD RYPKT<br />LJZWB CEFYH QNTRG<br />VPDKM UZLFQ . . .</p><small>TRANSMISSION 07 / 06:40</small></aside>
    <footer className="home-footer"><span><i /> THE INVESTIGATION AWAITS</span><span>CSET302 · AN INTERACTIVE STUDY OF COMPUTATION</span></footer>
  </main>;
}
