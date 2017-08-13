/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-11 20:03:25
*/

'use strict';

import {Colony} from "./colony";
import {ColonyRoom} from "./colony_room";
import {Serializable, SerialRaw} from "./traits";

export class ColonyCreep extends Serializable {
	constructor(protected _name: string, protected _type: string, protected _colony: string, protected _birth_place: string, protected _assigned_room: string) {
		super();
		if(!this._assigned_room) {
			this._assigned_room = this._birth_place;
		}
		_.set(Game, "colony_creeps."+_name, this);
	}

	get creep(): Creep|undefined {
		return Game.creeps[this._name];
	}

	get room(): Room|undefined {
		return Game.rooms[this.creep.room.name];
	}

	get assigned_room(): ColonyRoom {
		return Game.colony_rooms[this._assigned_room];
	}

	get colony(): Colony|undefined {
		return Game.colonies[this._colony];
	}

	run() {
		console.log(this, "is running");
		this.doGotoTargetRoom();
		this.doMyJob();
	}

	doGotoTargetRoom() {
		let target: string = this.assigned_room.name;
		if (this.room.name !== target) {
			this.moveTo(new RoomPosition(24,24, target));
		}
	}

	doMyJob() {
		if(_.sum(this.carry) < this.carryCapacity) {
			let source = this.getSource();
			this.moveTo(source);
			this.harvest(source);
		} else {
			let spawn = this.getSpawn();
			this.moveTo(spawn);
			this.transfer(spawn, RESOURCE_ENERGY);
		}
	}

	/*==============================
	=            Memory            =
	==============================*/

	toString(): string {
		return this._name;
	}

	serialize(): SerialRaw {
		return {
			class: "ColonyCreep",
			data: {
				_name: this._name,
				_type: this._type,
				_colony: this._colony,
				_birth_place: this._birth_place,
				_assigned_room: this._assigned_room,
			}
		}
	}

	static unserialize(x: SerialRaw): ColonyCreep {
		return new ColonyCreep(x.data._name, x.data._type, x.data._colony, x.data._birth_place, x.data._assigned_room);
	}

	/*===============================
	=            Utility            =
	===============================*/

	get carry() {
		return this.creep.carry;
	}

	get carryCapacity() {
		return this.creep.carryCapacity;
	}

	transfer(target: Creep|Structure, resourceType: string, amount?: number): number {
		return this.creep.transfer(target, resourceType, amount);
	}

	moveTo(pos: RoomPosition | {pos: RoomPosition}, opts?: MoveToOpts): number {
		return this.creep.moveTo(pos, opts);
	}

	harvest(target: Source|Mineral): number {
		return this.creep.harvest(target);
	}

	sayHello() {
		this.creep.say("Hello!");
	}

	getFlag(name: string): Flag {
	    return this.creep.pos.findClosestByRange<Flag>(FIND_FLAGS, {
	        filter: (f: Flag) => f.name === name
	    });
	}

	getSource(): Source {
	    return this.creep.pos.findClosestByPath<Source>(FIND_SOURCES, {filter: (source: Source) => {
	        return source.energy > 10;
	    }});
	}

	getSpawn(): Spawn {
	    return this.creep.pos.findClosestByRange<Spawn>(FIND_MY_SPAWNS);
	}

	getTower(): Tower {
	    return this.creep.pos.findClosestByPath<Tower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
	}

	getConstructionSite(): ConstructionSite|undefined {
	    let priority = [
	        {structureType: STRUCTURE_CONTAINER},
	        {structureType: STRUCTURE_ROAD},
	        {structureType: STRUCTURE_EXTENSION},
	        {structureType: STRUCTURE_STORAGE},
	    ];

	    let target: ConstructionSite|undefined;
	    _.forEach(priority, (options) => {
	        if (!target) {
	            target = this.creep.pos.findClosestByRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, {
	                filter: (x: ConstructionSite) => {
	                    return x.structureType === options.structureType;
	                }
	            });
	        }
	    });

	    if (!target) { 
	        target = this.creep.pos.findClosestByRange<ConstructionSite>(FIND_CONSTRUCTION_SITES);
	    }

	    return target;
	}

	getDamagedStructure(): Structure {
	    return this.creep.pos.findClosestByPath<Structure>(FIND_MY_CONSTRUCTION_SITES, {
	        filter: (structure: StructureSpawn) => structure.hits < structure.hitsMax,
	    });
	}

	getFillable(): StructureExtension|StructureSpawn|undefined {
	    let priority = [
	        {structureType: STRUCTURE_SPAWN},
	        {structureType: STRUCTURE_EXTENSION},
	    ];

	    let target: StructureExtension|StructureSpawn|undefined;
	    _.forEach(priority, (options) => {
	        if (!target) {
	            target = this.creep.pos.findClosestByRange<StructureExtension|StructureSpawn>(FIND_STRUCTURES, {
	                filter: (x: StructureExtension|StructureSpawn) => {
	                    return x.structureType === options.structureType && x.energy < x.energyCapacity;
	                }
	            });
	        }
	    });

	    return target;
	}

	getStockpile(): StructureContainer|StructureStorage {
	    return this.creep.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
	        filter: (structure:Structure) => structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE,
	    })
	}

	getStockpileWithResource(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage {
	    return this.creep.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
	        filter: (structure:StructureContainer|StructureStorage) => ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && structure.store && structure.store[resource] > 0),
	    })
	}

	getAvailableStockpile(): StructureContainer|StructureStorage {
	    return this.creep.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
	        filter: (structure:StructureContainer|StructureStorage) => ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity),
	    })
	}

	getAvailableLink(): StructureLink {
	    return this.creep.pos.findClosestByRange<StructureLink>(FIND_STRUCTURES, {
	        filter: (structure:StructureLink) => (structure.structureType === STRUCTURE_LINK && structure.energy < structure.energyCapacity),
	    })
	}

	getDroppedResource() {
	    return _.first(this.creep.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 10));
	}

	getSmallestStockpile(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage {
	    return _.min(this.creep.getStockpiles(), (c: StructureContainer|StructureStorage) => c.store[resource]);
	}

	getLargestStockpile(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage|undefined {
	    let x = _.max(this.creep.getStockpiles(), (c: StructureContainer|StructureStorage) => c.store[resource]);
	    return x.store[resource] > 0 ? x : undefined;
	}

	// getSpawnStockpile(spawn: Spawn): StructureContainer|StructureStorage {
	//     return spawn.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {filter: (s: StructureContainer|StructureStorage) => s.structureType===STRUCTURE_CONTAINER || s.structureType===STRUCTURE_STORAGE});
	// }

	getStockpiles(): (StructureContainer|StructureStorage)[] {
	    return this.creep.room.find<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
	        filter: (structure:Structure) => {return structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE},
	    })
	}
}