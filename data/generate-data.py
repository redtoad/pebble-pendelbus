#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import glob
import json
import os.path
import itertools

_here = os.path.dirname(os.path.abspath(__file__))
data_files = glob.glob(os.path.join(_here, '*.txt'))

class Station(object):

    _id_generator = itertools.count()
    _register = {}

    def __init__(self, name, lat=None, lon=None):
        self.id = next(self._id_generator)
        self.name = name
        self.lat = float(lat)
        self.lon = float(lon)

    def __format__(self, rep=None):
        if rep == 'json':
            return '{{id: {0.id}, name: {0.name!r}, coords: {{ lat: {0.lat}, lon: {0.lon} }} }}'.format(self)
        return object.__format__(self, rep)
    
    def __repr__(self):
        return '<Station %i %r (%f, %f)>' % (self.id, self.name, self.lat, self.lon)

    @classmethod
    def generate(cls, name, *args, **kwargs):
        if name in cls._register:
            return cls._register[name]
        else:
            instance = cls(name, *args, **kwargs)
            cls._register[name] = instance
            return instance

    @classmethod
    def all_generated(cls):
        return list(cls._register.values())
        

class Edge(object):

    _register = {}

    def __init__(self, from_, to):
        self.from_ = from_
        self.to = to
        self.times = []

    def __format__(self, rep=None):
        if rep == 'json':
            return '[{0.from_.id}, {0.to.id}, {0.times!r}]'.format(self)
        return object.__format__(self, rep)
    
    def __repr__(self):
        return '<Edge {0.from_.name} -> {0.to.name}>'.format(self)

    @classmethod
    def generate(cls, from_, to, *args, **kwargs):
        if (from_, to) in cls._register:
            return cls._register[from_, to]
        else:
            instance = cls(from_, to, *args, **kwargs)
            cls._register[from_, to] = instance
            return instance

    @classmethod
    def all_generated(cls):
        return list(cls._register.values())
        
        
def open_timetable(path):
        with open(path, encoding='utf-8', newline='') as fp:

            reader = csv.reader(fp, delimiter=';')

            def rows():
                # skip header and delimiters
                for row in reader:
                    if len(row) < 2:
                        continue
                    yield row

            def extract(values):
                return [Station.generate(*values[:3])] + values[3:]

            matrix = [extract(row) for row in rows()]
            matrix = [list(x) for x in zip(*matrix)]

            connections = []
            
            stations = matrix[0]
            for stops in matrix[1:]:
                paired = zip(stations, stops)
                prev = None
                for curr in paired:
                    if prev and prev != curr and prev[0] != curr[0] and curr[1] and prev[1]:
                        #print('{0[1]} {0[0].name:26} -> {1[1]} {1[0].name}'.format(prev, curr))
                        connections.append([prev, curr])
                        times = [int(tm.replace(':', '')) for tm in [prev[1], curr[1]]]
                        edge = Edge.generate(prev[0], curr[0])
                        edge.times.append(times)
                    prev = curr

            return connections

def store_as_json(path):
    stations = ',\n'.join(map('{:json}'.format, Station.all_generated()))
    edges    = ',\n'.join(map('{:json}'.format, Edge.all_generated()))
    return 'var stations=[{0}];\nvar edges = [{1}];'.format(stations, edges)


if __name__ == '__main__':
        
    print(data_files)
    for path in data_files:
        edges = open_timetable(path)
        #print(tt.as_json())
        #print([stop for stop in tt.stations])
    print(store_as_json(''))
