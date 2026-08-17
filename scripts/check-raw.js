import https from 'https';

https.get('https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Feature count:', json.features.length);
    console.log('Feature[0] properties:', json.features[0].properties);
    console.log('Feature[0] geometry type:', json.features[0].geometry.type);
    console.log('Feature[0] coordinates depth:', Array.isArray(json.features[0].geometry.coordinates), json.features[0].geometry.coordinates.length);
    console.log('Sample coord:', JSON.stringify(json.features[0].geometry.coordinates).slice(0, 300));
  });
});
