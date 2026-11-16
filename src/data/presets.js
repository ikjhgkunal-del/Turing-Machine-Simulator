const binary = {
  id: 'binary-ends-1',
  name: 'Binary string ends in 1',
  shortName: 'The last symbol',
  description: 'Read a binary string from left to right. Accept if its final symbol is 1; otherwise reject.',
  hint: 'Try 101 to accept, 100 to reject, or leave the input empty.',
  example: '101',
  states: ['qStart', 'qLast0', 'qLast1', 'qAccept', 'qReject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', '_'],
  blank: '_',
  startState: 'qStart',
  acceptState: 'qAccept',
  rejectState: 'qReject',
  transitions: ['qStart', 'qLast0', 'qLast1'].flatMap((from) => [
    { from, read: '0', write: '0', move: 'R', to: 'qLast0' },
    { from, read: '1', write: '1', move: 'R', to: 'qLast1' },
    { from, read: '_', write: '_', move: 'S', to: from === 'qLast1' ? 'qAccept' : 'qReject' },
  ]),
};

const crib = {
  id: 'crib-alignment',
  name: 'Enigma-inspired crib alignment check',
  shortName: 'A consistent intercept',
  description: 'D means the plaintext and ciphertext differ; S means they match. Scan D, reject on S, and accept at the end.',
  hint: 'This checks an Enigma alignment constraint; it does not reveal the rotor settings. It is a simplified classroom analogy, not Enigma decryption.',
  example: 'DDDDD',
  states: ['qScan', 'qAccept', 'qReject'],
  inputAlphabet: ['D', 'S'],
  tapeAlphabet: ['D', 'S', '_'],
  blank: '_',
  startState: 'qScan',
  acceptState: 'qAccept',
  rejectState: 'qReject',
  transitions: [
    { from: 'qScan', read: 'D', write: 'D', move: 'R', to: 'qScan' },
    { from: 'qScan', read: 'S', write: 'S', move: 'S', to: 'qReject' },
    { from: 'qScan', read: '_', write: '_', move: 'S', to: 'qAccept' },
  ],
};

export const presets = [binary, crib];
export const copyDefinition = (definition) => structuredClone(definition);
