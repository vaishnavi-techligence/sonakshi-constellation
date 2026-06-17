import youtubedl from 'youtube-dl-exec';

youtubedl('ytsearch1:BTS Blue & Grey audio', {
  extractAudio: true,
  audioFormat: 'm4a',
  output: 'public/blue_and_grey.m4a',
}).then(output => console.log('Downloaded:', output)).catch(err => console.error('Error:', err));
