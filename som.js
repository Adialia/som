var _ = require('underscore');

var Som = function(_config)
{
	var that = this;
	var config = _config ||{};
	
	var euclideanDistance = function(_vector1, _vector2)
	{
		var distance = 0;
		
		for (var i = 0, length = _vector1.length; i < length; i++)
		{
			var value1 = 0, value2 = 0;

			if (_vector1[i] !== null && _vector1[i] !== undefined) { value1 = _vector1[i]; }
			if (_vector2[i] !== null && _vector2[i] !== undefined) { value2 = _vector2[i]; }
			
			distance += Math.pow((value1 - value2), 2);
		}

		if (_vector2.length > _vector1.length)
		{
			for (var i = _vector1.length, length = (_vector2.length - _vector1.length); i < length; i++)
			{
				distance += Math.pow(_vector2[item], 2);
			}
		}

		//return Math.sqrt(distance);
		return distance;
	};

	var max = function (_a, _b)
	{
		return (_a > _b) ? _a : _b;
	};

	this.traineeIndex = {};
	this.width = config.width||100;
	this.height = config.height||100;
	this.distanceFunction = config.distanceFunction || euclideanDistance;
	this.initialRadius = config.initialRadius || max(this.width, this.height)/2;
	this.iterationCount = config.iterationCount;
	this.initialLearningRate = config.initialLearningRate||0.1;

	this.features = {};

	if (!config.features || config.features.length === 0)
	{
		throw Error('Provide the list of features for the vectors.');
	}
	else
	{
		config.features.forEach(function(_feature, _index)
		{
			that.features[_feature] = _index;
		});
	}
	
	this.currentIteration = 1;

	if (this.iterationCount === undefined || this.iterationCount === null)
	{
		throw Error('Provide in the config object the iteration count as {iterationCount: X} where X is the expected number of iterations');
	}

	this.nodeList = [];
};

var Node = function(_config)
{
	this.neighbors = {};
	
	if (!_config.weights)
	{
		throw Error('Provide weights for initialization of a node in the map');
	}

	this.weights = _config.weights;
	
	this.x = _config.x;
	this.y = _config.y;
	this.i = _config.i;
};

Node.prototype.add = function(_id, _vector, _category)
{
	var category = _category||'default';
	this.neighbors[category] = this.neighbors[category]||[]; 
	this.neighbors[category].push({id: _id});
};

Som.prototype.index = function(_id, _node)
{
	this.traineeIndex[_id] = _node;
}

Som.prototype.neighbors = function(_id, _radius)
{
	var neighbors = [];

	var bestMatchingNode = this.traineeIndex[_id];

	if (!bestMatchingNode)
	{
		throw Error('Unable to find node for id:' + _id);
	}
	
	var that = this;
	
	if (!_radius)
	{
		neighbors.push({distance: 0, neighbors: bestMatchingNode.neighbors});
	}
	else
	{
		//run through all the nodes and find the neighbors per node
		//within the given radius ...
		this.nodeList.forEach(function(_node)
		{
			if (_.isEmpty(_node.neighbors) === false)
			{
				var distance = that.distanceFunction(_node.weights, bestMatchingNode.weights);

				if (distance < (_radius * _radius))
				{
					neighbors.push({distance: distance, neighbors: _node.neighbors});
				}
			}
		});
		
		neighbors;
	}

	return neighbors;
};

Som.prototype.train = function(_id, _vector)
{
	var that = this;
	
	var currentIteration = this.currentIteration;

	if (currentIteration > this.iterationCount)
	{
		console.log('ERROR');
		throw Error('Cannot train anymore ... current iteration is greater than the expected iteration count of: ' + this.iterationCount);
	}
	
	this.currentIteration += 1;

	var determineLocalRadius = function(_iteration)
	{
		var max = function (_a, _b)
		{
			return (_a > _b) ? _a : _b;
		};

		var timeConstant = that.iterationCount/Math.log(that.initialRadius);

		return that.initialRadius * Math.exp(-(_iteration/timeConstant));
	};

	var determineLearningRate = function(_iteration)
	{
		return that.initialLearningRate * Math.exp(-(_iteration/that.iterationCount));
	};

	var radius = determineLocalRadius(currentIteration);
	var learningRate = determineLearningRate(currentIteration);

	var bestMatchingNode = this.bestMatchingUnit(_vector);
	bestMatchingNode.add(_id, _vector);
	this.index(_id, bestMatchingNode);
	
	this.nodeList.forEach(function(_node)
	{
		var distance = that.distanceFunction(bestMatchingNode.weights, _node.weights);

		if (distance < (radius * radius))
		{
			//adjust weights for this _node

			var influence = Math.exp(-(distance/(2 * (radius * radius))));

			if (influence <= 0) { influence = 1; }

			for (var feature in that.features)
			{
				var featureIndex = that.features[feature];
				var vectorFeature = _vector[feature]||0;
				_node.weights[featureIndex] = _node.weights[featureIndex] + (influence * learningRate * (vectorFeature - _node.weights[featureIndex]));
			}
		}
	});
};

Som.prototype.bestMatchingUnit = function(_vector)
{
	var bestMatchingUnit = this.nodeList[0];
	var smallestDistance = 100000000;
	var that = this;
	
	this.nodeList.forEach(function(_node)
	{
		var weights = [];
		
		for (var feature in _vector)
		{
			weights[that.features[feature]] = _vector[feature];
		}
		
		var distance = that.distanceFunction(_node.weights, weights);

		if (distance < smallestDistance)
		{
			smallestDistance = distance;
			bestMatchingUnit = _node;
		}
	});

	return bestMatchingUnit;
};


Som.prototype.init = function(_config)
{
	var somSize = this.width * this.height;

	var randomize = function(_features, _somSize, _precision)
	{
		//We want to reduce to probability of a vector collision to
		//close to zero ... this allows us to avoid checking the node
		//list for duplicates.  This becomes more effective as the
		//feature count increases.

		var precision = Math.pow(10, _precision)|| Math.pow(10, (Math.ceil(Math.log(_somSize)/Math.LN10) + 2));
		
		var vector = [];

		for (feature in _features)
		{
			var featureIndex = _features[feature];
			vector[featureIndex] = Math.round(Math.random() * precision)/precision;
		}

		return new Node({weights: vector});
	};
	
	if (_config.nodes && _config.nodes.length === somSize)
	{
		this.nodeList = _config.nodeList;
	}
	else
	{
		var row = 0;
		var column = 0;
		
		for (var i = 0; i < somSize; i++)
		{
			var node = randomize(this.features, somSize, _config.precision);

			node.x = row;
			node.y = column;
			node.i = i;

			column++;

			if (column === this.width) { row++; column = 0; }

			this.nodeList.push(node);
		}
	}
	else
	{
		throw Error('Provide either a non empty list of initialized nodes { nodes: [] }, or provide a non empty list of weight features { features: [] } for random node creation');
	}
};

exports.create = function (_config)
{
	return new Som(_config);
};