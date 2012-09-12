som
===

Som is a a self organizing map implementation written in JavaScript.

## Installation

npm install som

## Example

```
//Create a SOM of four (width X height) nodes.  It will expect five items to be submitted for training.
var som = require('som').create({features:  ['hello', 'hola', 'ciao'], iterationCount: 5, width: 2, height: 2});
var util = require('util');

//initialize SOM with default distance function (euclidean)
som.init({});

//begin training SOM
som.train('english-1', {'hello': 1, 'hola': 0, 'ciao': 0});
som.train('spanish-1', {'hello': 0, 'hola': 1, 'ciao': 0});
som.train('italian-1', {'hello': 0, 'hola': 0, 'ciao': 1});
som.train('english-2', {'hello': 4, 'hola': 0, 'ciao': 1});
som.train('english-3', {'hello': 5, 'hola': 0});

//Look at the internal structure of the SOM
console.log('SOM', util.inspect(som, false, 8));

//look at the index of trained nodes in the SOM
console.log('INDEX', util.inspect(som.traineeIndex, false, 8));

//Perform a SOM neigborhood search of distance 2 from the node that holds the value 'english-1'.
var neighbors = som.neighbors('english-1', 2);
console.log('NEIGHBORS', util.inspect(neighbors, false, 8));
```