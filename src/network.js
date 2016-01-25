/**
 * Copyright (C) 2016
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
            //console.debug('Add new station ' + node.name + '.');
            this.stations[node.id] = node;
        } else {
            //console.debug('Station ' + node.name + ' already added.');
        }
    }.bind(this));

    // create edges
    data.connections.forEach(function _createEdges (edge) {
        var from = this.stations[edge[0]]; // next node
        var to   = this.stations[edge[1]];
        //console.debug('Add new connection ' + from.name + ' -> ' + to.name);
        from.next.push(new Edge(to, edge[2]));
    }.bind(this));
};

/**
 * Find shortest path
 * @param {Node} source
 * @param {Node} target
 * @param {number} time
 */
Network.prototype.findPath = function findPath (source, target, time) {

    /*
    function currentTime() {
        var now = new Date();
        return now.getHours() * 100 + now.getMinutes();
    }

    time = time || currentTime();
    */

    console.log('Find path from ' + source + ' to ' + target + ' at ' + time);

    var queue = [];
    var dist = {}, prev = {};

    for (var key in this.stations) {
        if (this.stations.hasOwnProperty(key)) {
            dist[key] = Number.MAX_VALUE;
            prev[key] = undefined;
            queue.push(key);
        }
    }

    dist[source.id] = 0;  // distance from source to source

    while (queue.length > 0) {

        // vertex with min distance to source
        var u = undefined, umin = Number.MAX_VALUE;
        queue.forEach(function (key) {
            if (!u || dist[key] < umin) {
                u = key;
                umin = dist[key];
            }
        });

        // remove u from queue
        var index = queue.indexOf(u);
        if (index > -1) {
            queue.splice(index, 1);
        }

        if (u == target.id) {
            // build shortest path
            var path = [this.stations[u]];
            while (prev[u]) {
                path.push(this.stations[prev[u]]);
                u = prev[u];
            }
            path.reverse();
            return path;
        }

        var neighbours = this.stations[u].next;
        for (var i = 0; i < neighbours.length; i++) {
            var v = neighbours[i], alt = dist[u] + 1;
            if (alt < dist[v.station.id]) {
                dist[v.station.id] = alt;
                prev[v.station.id] = u;
            }
        }

    }

    return [];
};

/**
 * @returns {[Node]}
 */
Network.prototype.getStations = function() {
    var stations = [];
    for (var id in this.stations) {
        // skip loop if the property is from prototype
        if (!this.stations.hasOwnProperty(id)) continue;
        stations.push(this.stations[id]);
    }
    return stations;
};

/**
 * @param {Number} lat - latitude
 * @param {Number} lon - longitude
 */
Network.prototype.findNearestNode = function (lat, lon) {
    var here = {lat: lat, lon: lon}, mind, mins;
    for (var st in this.getStations()) {
        var d = distanceLatLon(here, st.coords);
        if (typeof mins == 'undefined' || d < mind) {
            mins = st;
            mind = d;
        }
    }
    return mins;
};

/**
 * Calculates distance (in km) between two coordinates.
 * http://stackoverflow.com/a/365853/294082
 *
 * @param {{lat: Number, lon: Number}} pos1 - first position with latitude and longitude
 * @param {{lat: Number, lon: Number}} pos2 - second position with latitude and longitude
 * @returns {number}
 */
function distanceLatLon(pos1, pos2) {
    var toRad = function(deg) { return deg * (Math.PI / 180); };
    var R = 6371; // km
    var dLat = toRad(pos2.lat - pos1.lat);
    var dLon = toRad(pos2.lon - pos1.lon);
    var lat1 = toRad(pos1.lat);
    var lat2 = toRad(pos2.lat);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = Network;
  