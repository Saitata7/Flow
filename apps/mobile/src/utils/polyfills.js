// src/utils/polyfills.js
// General polyfills for React Native

import 'react-native-get-random-values';
import { Buffer } from '@craftzdog/react-native-buffer';
import CryptoJS from 'crypto-js';

// Polyfill global objects
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Polyfill crypto
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr) => {
      const bytes = CryptoJS.lib.WordArray.random(arr.length);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = bytes.words[Math.floor(i / 4)] >>> (24 - (i % 4) * 8);
      }
      return arr;
    },
    subtle: {
      digest: async (algorithm, data) => {
        const wordArray = CryptoJS.lib.WordArray.create(data);
        const hash = CryptoJS.SHA256(wordArray);
        return new Uint8Array(hash.words.length * 4).map((_, i) => 
          (hash.words[Math.floor(i / 4)] >>> (24 - (i % 4) * 8)) & 0xff
        );
      }
    }
  };
}

// Polyfill TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

export default {};
