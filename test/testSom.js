console.log('create som', +new Date());
var som = require('som').create({iterationCount: 5, width: 10, height: 10});
console.log('end create som', +new Date());

var util = require('util');

som.init({features: ['hello', 'hola', 'ciao']});

som.train('english-1', {'hello': 1, 'hola': 0, 'ciao': 0});
som.train('spanish-1', {'hello': 0, 'hola': 1, 'ciao': 0});
som.train('italian-1', {'hello': 0, 'hola': 0, 'ciao': 1});
som.train('english-2', {'hello': 4, 'hola': 0, 'ciao': 1});

console.log('start', +new Date());

som.train('english-3', {'hello': 5, 'hola': 0});

console.log('end', +new Date());

console.log('SOM', util.inspect(som, false, 8));
console.log('INDEX', util.inspect(som.traineeIndex, false, 8));
console.log('NEIGHBORS', util.inspect(som.neighbors('english-1', 2), false, 8));

