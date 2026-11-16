function describeRule(rule) { return `${rule.read} → ${rule.write}, ${rule.move}`; }

export default function StateDiagram({ definition, configuration }) {
  const { states, transitions, startState, acceptState, rejectState } = definition;
  const last = configuration.lastTransition;
  const highlighted = (rule) => last && rule.from === last.from && rule.read === last.read;
  // Labels stay legible on the graph for small machines; larger ones get a complete rule list.
  const useList = states.length > 5 || transitions.length > 10;
  const width = 620;
  const height = 310;
  const radius = states.length === 3 ? 86 : 106;
  const points = states.map((state, index) => {
    const angle = (Math.PI * 2 * index) / states.length - Math.PI / 2;
    return { state, x: width / 2 + radius * 1.75 * Math.cos(angle), y: height / 2 + radius * Math.sin(angle) };
  });
  const groups = new Map();
  for (const rule of transitions) {
    const key = JSON.stringify([rule.from, rule.to]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rule);
  }
  return <div className="diagram-region">
    <div className="state-key"><span>→ start</span><span>◎ accept</span><span>× reject</span><span className="current-key">● current</span></div>
    {useList ? <div className="graph-fallback">
      <div className="state-chips">{states.map((state) => <span key={state} className={state === configuration.state ? 'current' : ''}>{state === startState ? '→ ' : ''}{state}{state === acceptState ? ' ◎' : state === rejectState ? ' ×' : ''}</span>)}</div>
      <ul aria-label="State transitions">{transitions.map((rule, index) => <li className={highlighted(rule) ? 'active-rule' : ''} key={index}><code>{rule.from} → {rule.to}</code><code>{describeRule(rule)}{highlighted(rule) ? ' · last' : ''}</code></li>)}</ul>
      {!transitions.length && <p className="small muted">No rules. The first attempted step will halt.</p>}
    </div> : <>
      <svg className="state-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Machine state diagram. Current state: ${configuration.state}. Full rules are listed below.`}>
        <defs>
          <marker id="arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="#768080" /></marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="#c1a17a" /></marker>
        </defs>
        {[...groups.entries()].map(([key, rules]) => {
          const from = points.find((point) => point.state === rules[0].from);
          const to = points.find((point) => point.state === rules[0].to);
          const active = rules.some(highlighted);
          if (!from || !to) return null;
          let path;
          if (from === to) path = `M${from.x - 19},${from.y - 23} C${from.x - 65},${from.y - 86} ${from.x + 65},${from.y - 86} ${from.x + 19},${from.y - 23}`;
          else {
            const dx = to.x - from.x, dy = to.y - from.y, distance = Math.hypot(dx, dy);
            const nx = dx / distance, ny = dy / distance;
            path = `M${from.x + nx * 33},${from.y + ny * 33} Q${(from.x + to.x) / 2 - ny * 33},${(from.y + to.y) / 2 + nx * 33} ${to.x - nx * 36},${to.y - ny * 36}`;
          }
          return <path key={key} d={path} className={active ? 'graph-edge active' : 'graph-edge'} markerEnd={`url(#arrow-${active ? 'active' : 'default'})`}><title>{rules.map((rule) => `${rule.from} → ${rule.to}: ${describeRule(rule)}`).join('; ')}</title></path>;
        })}
        {points.map(({ state, x, y }) => <g key={state} className={`graph-node ${configuration.state === state ? 'current' : ''}`} transform={`translate(${x},${y})`}>
          <circle r="32" />{state === acceptState && <circle r="26" />}
          {state === startState && <path className="start-arrow" d="M-58 0h22m-7-5 7 5-7 5" />}
          <text textAnchor="middle" y="4">{state.length > 10 ? state.slice(0, 9) + '…' : state}</text>
          {state === rejectState && <text className="reject-cross" textAnchor="middle" y="49">× reject</text>}
          <title>{state}{configuration.state === state ? ' — current state' : ''}</title>
        </g>)}
      </svg>
      <details className="graph-labels" open><summary>Read transition labels <span>{transitions.length} rules</span></summary><ul>{transitions.map((rule, index) => <li className={highlighted(rule) ? 'active-rule' : ''} key={index}><code>{rule.from} → {rule.to}</code><code>{describeRule(rule)}{highlighted(rule) ? ' · last' : ''}</code></li>)}</ul></details>
    </>}
  </div>;
}
