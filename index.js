'use strict';

function mod(x, n) {
  return ((x % n) + n) % n;
}

const diatonicDiff = [2, 2, 1, 2, 2, 2, 1];

/**
 * Create a diatonic scale for a given mode. Mode 0 is the Ionian mode.
 *
 * @param {number} mode 
 * @returns {[number, number, number, number, number, number, number]}
 */
function makeScale(mode) {
  const scale = [];
  let note = 0;
  for (let i = 0; i < 7; i++) {
    scale.push(note);
    note += diatonicDiff[mod(mode + i, 7)];
  }
  return scale;
}

const mode1Scale = makeScale(5);
function createKey(scale) {
  return (i) => ((Math.floor(i / 7) * 12) + scale[mod(i, 7)]);
}

const mode = createKey(makeScale(6));
const major = createKey(makeScale(0));
const minorScale = [0, 2, 3, 5, 7, 8, 10];
const minor = createKey(minorScale);
const minorHarmScale = [0, 2, 3, 5, 7, 8, 11];
const minorHarm = createKey(minorHarmScale);

function frequency(n) {
  return 220 * (2 ** ((n + 3) / 12));
}

function twice(a) {
  return [
    ...a,
    ...a,
  ];
}

function line(a) {
  return [a[0], a[1], a[2], a[3], a[4], a[2], a[3], a[4]];
}

function createPrelude(key) {
  const dominant4 = (note) => key(note - 3) + 5;
  const dominant5 = (note) => key(note - 4) + 7;
  const minor2 = (note) => minorHarm(note - 1) + 2;
  const minor3 = (note) => minorHarm(note - 2) + 3;
  const dominant7 = (note) => key(note - 6) + 11;

  const prelude = [
    [[0, 2, 4, 7, 9], key],
    [[0, 1, 5, 8, 10], key],
    [[-1, 1, 4, 8, 10], key],
    [[0, 2, 4, 7, 9], key],
    [[0, 2, 5, 9, 12], key],
    [[0, 1, 3, 5, 8], dominant5],
    [[-1, 1, 4, 8, 11], key],
    [[-1, 0, 2, 4, 7], key],
    [[-2, 0, 2, 4, 7], key],
    [[-6, -4, 1, 3, 7], dominant5],
    [[-3, -1, 1, 4, 6], key],
    [[-3, -1, 2, 4, 7], minor2],
    [[-4, -2, 1, 5, 8], key],
    [[-4, -2, 1, 3, 7], minor3], // 0:49
    [[-5, -3, 0, 4, 7], key],
    [[-5, -4, -2, 0, 3], key], // 0:56
    [[-6, -4, -2, 0, 3], key],
    [[-10, -6, -3, -1, 3], key],
    [[0, 2, 4, 7, 9].map(x => x - 7), key],
    [[-7, -3, -1, 0, 2], dominant4],
    [[-11, -4, -2, 0, 2], key], //1:15
    //[[-11, -7, -2, 0, 2].map(key), key],
  ].flatMap(x => twice(line(x[0].map(x[1]))));

  return prelude;
}

const startElement = document.getElementById('start');

let context = null;
let audio = null;

function start() {
  if (!context) {
    context = new AudioContext();
  }

  function setPeriodicWave(o) {
    const SIZE = 32;
    const real = new Float32Array(SIZE);
    const imag = new Float32Array(SIZE);

    real[0] = 0;
    //imag[0] = 0;
    real[1] = 0.75;
    //imag[1] = 0.1;
    real[2] = 0.5;
    real[3] = 0.0;
    real[4] = 0.1;
    real[5] = 0.1;
    real[6] = 0.05;
    //for (let i = 1; i < SIZE; i += 1) {
      //real[i] = (Math.random() * ((SIZE - i) / SIZE)) ** 2;
      //imag[i] = (Math.random() * ((SIZE - i) / SIZE)) ** 2;
    //}

    const wave = context.createPeriodicWave(real, imag, {disableNormalization: true});
    o.setPeriodicWave(wave);
    console.log(real, imag);
  }

  if (audio && audio.state === 'on') {
    audio.g.gain.exponentialRampToValueAtTime(
      0.00001, context.currentTime + 0.04
    );
    audio.state = 'transition';
    //audio.o.stop();
    //audio = null;
    startElement.textContent = 'Start';
    
  } else {
    const o = context.createOscillator();
    //o.type = 'triangle';
    setPeriodicWave(o);

    const song = createPrelude(major);

    //const noteLength = 1 / 16;
    //const noteLength = 1 / 4;
    const noteLength = 1 / 6;

    const ct = context.currentTime;
    for (let i = 0; i < song.length; i += 1) {
      const note = song[i]
      o.frequency.setValueAtTime(frequency(note), ct + (i * noteLength));
    }

    const g = context.createGain();
    g.gain.setTargetAtTime(
      0.00001, context.currentTime + song.length * noteLength, 0.01
    );

    o.connect(g);
    g.connect(context.destination);
    o.start(0);
    audio = {
      o,
      g,
      state: 'on',
    };

    startElement.textContent = 'Stop';
  }
}

startElement.addEventListener('click', start);
