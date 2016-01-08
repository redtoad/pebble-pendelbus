/**
 * Copyright (C) 2016
 * jambit GmbH
 *
 * Sebastian Rahlf <basti@redtoad.de>
 */

/**
 * @param {{}} data
 * @param {string} data.name
 * @param {{}} data.coords
 * @param {number} data.coords.lat
 * @param {number} data.coords.lon
 * @constructor
 */
function Node (data) {
    this.id = data.id;
    this.name = data.name;
    this.coords = data.coords || {};
    this.next = [];
}

/**
 *
 * @param {Node} to - destination
 * @param {[int, int]} departures_arrivals - departures and arrival times
 * @constructor
 */
function Edge (to, departures_arrivals) {
    this.station = to;
    this.times = departures_arrivals;
}

Edge.prototype.nextDeparture = function (time) {
    // Note: Assumes times are already sorted!
    for (var i = 0; i < this.dept.length; i++) {
        if (this.dept[i] > time) {
            return this.dept[i];
        }
    }
    return null; // nothing found!
};

/**
 *
 * @param {{}} data
 * @param {{}} data.stations
 * @param {{}} data.connections
 *
 */
var Network = function(data) {
    this.stations = {};

    // create nodes
    data.stations.forEach(function _createNodes(station) {
        var node = new Node(station);
        if (!this.stations[node.id]) {
            console.debug('Add new station ' + node.name + '.');
            this.stations[node.id] = node;
        } else {
            console.debug('Station ' + node.name + ' already added.');
        }
    }.bind(this));

    // create edges
    data.connections.forEach(function _createEdges (edge) {
        var from = this.stations[edge[0]]; // next node
        var to   = this.stations[edge[1]];
        console.debug('Add new connection ' + from.name + ' -> ' + to.name);
        from.next.push(new Edge(to, edge[2]));
    }.bind(this));
};

/**
 * DFS path finding
 * @param {string} from
 * @param {string} to
 * @param {number} time
 */
Network.prototype.findPath = function findPath (from, to, time) {

    function currentTime() {
        var now = new Date();
        return now.getHours() * 100 + now.getMinutes();
    }

    time = time || currentTime();

    console.log('Find path from ' + from + ' to ' + to + ' at ' + time);

    var stack = [];
    var visited = [];
    var node;

    var beenThere = function (node) {
        for (var i = visited.length - 1; i >= 0; i--) {
            // TODO check for time
            if (visited[i] === node) {
                return true;
            }
        }
        return false; // otherwise not visited
    }.bind(this);

    stack.push(this.stations[from]);
    var goal = this.stations[to];
    var now = time;
    var found = false;

    while (stack.length) {
        node = stack.pop();
        console.debug('Visiting ' + node.name + '...');
        // TODO add times
        visited.push(node);
        if (node === goal) {
            found = true;
        } else {
            for (var i = 0; i < node.next.length; i++) {
                var next = node.next[i].station;
                if (next && 0 > stack.indexOf(next) && !beenThere(next)) {
                    stack.push(next);
                }
            }
        }
    }

    return (found) ? visited : [];
};

module.exports = Network;
