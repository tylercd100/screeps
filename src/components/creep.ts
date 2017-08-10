/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-09 13:21:15
*/

'use strict';

interface Creep {
	sayHello(): void;
	getFlag(name: string): Flag
	getSource();
	getSpawn();
	getTower();
	getConstructionSite();
	getDamagedStructure();
	getFillable();
	getStockpile();
	getStockpileWithResource();
	getAvailableStockpile();
	getAvailableLink();
	getDroppedResource();
	getSmallestStockpile();
	getLargestStockpile();
	// getSpawnStockpile(spawn: Spawn): StructureContainer|StructureStorage;
	getStockpiles();
}

Creep.prototype.sayHello = function() {
	let self: Creep = this;
	self.say("Hello!");
}

Creep.prototype.getFlag = function(name: string): Flag {
	let self: Creep = this;
    return self.pos.findClosestByRange<Flag>(FIND_FLAGS, {
        filter: (f: Flag) => f.name === name
    });
}

Creep.prototype.getSource = function(): Source {
	let self: Creep = this;
    return self.pos.findClosestByPath<Source>(FIND_SOURCES, {filter: (source: Source) => {
        return source.energy > 10;
    }});
}

Creep.prototype.getSpawn = function(): Spawn {
	let self: Creep = this;
    return self.pos.findClosestByRange<Spawn>(FIND_MY_SPAWNS);
}

Creep.prototype.getTower = function(): Tower {
	let self: Creep = this;
    return self.pos.findClosestByPath<Tower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
}

Creep.prototype.getConstructionSite = function(): ConstructionSite|undefined {
	let self: Creep = this;
    let priority = [
        {structureType: STRUCTURE_CONTAINER},
        {structureType: STRUCTURE_ROAD},
        {structureType: STRUCTURE_EXTENSION},
        {structureType: STRUCTURE_STORAGE},
    ];

    let target: ConstructionSite|undefined;
    _.forEach(priority, (options) => {
        if (!target) {
            target = self.pos.findClosestByRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, {
                filter: (x: ConstructionSite) => {
                    return x.structureType === options.structureType;
                }
            });
        }
    });

    if (!target) { 
        target = self.pos.findClosestByRange<ConstructionSite>(FIND_CONSTRUCTION_SITES);
    }

    return target;
}

Creep.prototype.getDamagedStructure = function(): Structure {
	let self: Creep = this;
    return self.pos.findClosestByPath<Structure>(FIND_MY_CONSTRUCTION_SITES, {
        filter: (structure: StructureSpawn) => structure.hits < structure.hitsMax,
    });
}

Creep.prototype.getFillable = function(): StructureExtension|StructureSpawn|undefined {
	let self: Creep = this;
    let priority = [
        {structureType: STRUCTURE_SPAWN},
        {structureType: STRUCTURE_EXTENSION},
    ];

    let target: StructureExtension|StructureSpawn|undefined;
    _.forEach(priority, (options) => {
        if (!target) {
            target = self.pos.findClosestByRange<StructureExtension|StructureSpawn>(FIND_STRUCTURES, {
                filter: (x: StructureExtension|StructureSpawn) => {
                    return x.structureType === options.structureType && x.energy < x.energyCapacity;
                }
            });
        }
    });

    return target;
}

Creep.prototype.getStockpile = function(): StructureContainer|StructureStorage {
	let self: Creep = this;
    return self.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
        filter: (structure:Structure) => structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE,
    })
}

Creep.prototype.getStockpileWithResource = function(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage {
	let self: Creep = this;
    return self.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
        filter: (structure:StructureContainer|StructureStorage) => ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && structure.store && structure.store[resource] > 0),
    })
}

Creep.prototype.getAvailableStockpile = function(): StructureContainer|StructureStorage {
	let self: Creep = this;
    return self.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
        filter: (structure:StructureContainer|StructureStorage) => ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity),
    })
}

Creep.prototype.getAvailableLink = function(): StructureLink {
	let self: Creep = this;
    return self.pos.findClosestByRange<StructureLink>(FIND_STRUCTURES, {
        filter: (structure:StructureLink) => (structure.structureType === STRUCTURE_LINK && structure.energy < structure.energyCapacity),
    })
}

Creep.prototype.getDroppedResource = function() {
	let self: Creep = this;
    return _.first(self.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 10));
}

Creep.prototype.getSmallestStockpile = function(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage {
	let self: Creep = this;
    return _.min(self.getStockpiles(), (c: StructureContainer|StructureStorage) => c.store[resource]);
}

Creep.prototype.getLargestStockpile = function(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage|undefined {
	let self: Creep = this;
    let x = _.max(self.getStockpiles(), (c: StructureContainer|StructureStorage) => c.store[resource]);
    return x.store[resource] > 0 ? x : undefined;
}

// Creep.prototype.getSpawnStockpile = function(spawn: Spawn): StructureContainer|StructureStorage {
// 	let self: Creep = this;
//     return spawn.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {filter: (s: StructureContainer|StructureStorage) => s.structureType===STRUCTURE_CONTAINER || s.structureType===STRUCTURE_STORAGE});
// }

Creep.prototype.getStockpiles = function(): (StructureContainer|StructureStorage)[] {
	let self: Creep = this;
    return self.room.find<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
        filter: (structure:Structure) => {return structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE},
    })
}