/*
* @Author: Tyler Arbon
* @Date:   2017-07-31 19:58:29
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-01 10:44:59
*/

'use strict';

import * as Plans from "./../rooms/Plans";

export interface INest {
	name: string;
	rooms: INestRoom[];
}

export interface INestRoom {
	name: string;
	updated_at: number,
	plans: {
		military: number;
		industry: number;
	}
	contains?: {
		updated_at: number;
		valuables: {
			sources: number;
			source_points: number;
		}
		enemy: {
			spawn: boolean;
			creeps: number;
			military: number;
		}
		ally: {
			spawn: boolean;
			creeps: number;
			military: number;
		}
		my: {
			spawn: boolean;
			creeps: number;
			military: number;
		}
	}
}

export class Nest implements INest {
	constructor(public name: string, public rooms: INestRoom[]) {}

	run() {
		_.forEach(this.getCreeps(), (creep: Creep) => {
			if(!_.find(this.rooms, {name: creep.room})) {
				this.rooms.push({
					name: creep.room.name,
					updated_at: Game.time,
					plans: {
						military: Plans.IGNORE,
						industry: Plans.IGNORE,
					}
				});
			}
		});

		this.recordRoomContents();
		this.assignRooms();
		this.assignCreeps();
		this.buildMissingCreeps();
	}

	protected recordRoomContents() {
		_.forEach(this.rooms, (b: INestRoom) => {
			let a: Room = Game.rooms[b.name];
			if (a) {
				b.contains = _.merge(b.contains, {
					updated_at: Game.time,
					valuables: {
						sources: this.countSources(a, b),
						source_points: this.countSourcePoints(a, b),
					},
					enemy: {
						spawn: this.countEnemySpawns(a) > 0,
						creeps: this.countEnemyCreeps(a),
						military: this.countEnemyMilitary(a),
					},
					ally: {
						spawn: this.countAllySpawns(a) > 0,
						creeps: this.countAllyCreeps(a),
						military: this.countAllyMilitary(a),
					},
					my: {
						spawn: this.countMySpawns(a) > 0,
						creeps: this.countMyCreeps(a),
						military: this.countMyMilitary(a),
					}
				});
			}
		});
	}

	protected assignRooms() {
		_.forEach(this.rooms, (room: INestRoom) => {
			if(room.plans.industry !== Plans.BASE) {
				// military
				let hasAllySpawn    = _.get(room, "contains.ally.spawn");
				let hasEnemySpawn   = _.get(room, "contains.enemy.spawn");
				let hasEnemyCreeps  = _.get(room, "contains.enemy.creeps") > 0;
				let hasMyCreeps     = _.get(room, "contains.my.creeps") > 0;
				let hasSourcePoints = _.get(room, "contains.valuables.source_points") > 0;

				if(hasAllySpawn || (hasMyCreeps && hasEnemyCreeps)) {
					room.plans.military = Plans.DEFEND;
				} else {
					room.plans.military = Plans.IGNORE;
				}

				// industry
				if(hasSourcePoints && room.plans.military !== Plans.ATTACK && room.plans.military !== Plans.DEFEND) {
					room.plans.industry = Plans.HARVEST_SOURCES;
				} else {
					room.plans.industry = Plans.IGNORE;
				}
			}
		});
	}

	protected assignCreeps() {
		let creeps = this.getCreeps();
		_.forEach(this.rooms, (room) => {
			let needs = this.getNeededCreepCounts(room);
			_.forEach(creeps, (creep: Creep) => {
				for(const type in needs) {
					if (creep.memory.type === type && needs[type] > 0) {
						creep.memory.station = room.name;
						needs[type]--;
						_.remove(creeps, creep);
					}
				}
				creep.memory.station = room.name;
			});
		});

		_.forEach(creeps, (creep: Creep) => {
			creep.memory.station = this.name;
		});
	}

	protected assignHarvesters() {
		this.getSourcePointCount();
	}

	protected getNeededCreepCounts(room: INestRoom) {
		return {
			"harvester": this.getNeededHarvesterCreepCount(room),
			"melee": this.getNeededMeleeCreepCount(room),
		}
	}

	protected getNeededHarvesterCreepCount(room: INestRoom): number {
		return _.get<number>(room, "plans.industry", Plans.IGNORE) === Plans.HARVEST_SOURCES ? _.get<number>(room, "contains.valuables.sources", 0) : 0;
	}

	protected getNeededMeleeCreepCount(room: INestRoom): number {
		return 0;
	}

	protected getSourcePointCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isHarvestSourcePlan = _.get<number>(r, "plans.industry", null) === Plans.HARVEST_SOURCES;
			return isHarvestSourcePlan ? _.get<number>(r, "valuables.source_points", 0) : 0;
		}));
	}

	protected getPlanHarvestSourcesCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isHarvestSourcePlan = _.get<number>(r, "plans.industry", null) === Plans.HARVEST_SOURCES;
			return isHarvestSourcePlan ? 1 : 0;
		}));
	}

	protected getCreeps(type: string = null): Creep[] {
		let creeps: Creep[] = [];
		for(const name in Game.creeps) {
			let creep = Game.creeps[name];
			if (creep.memory.nest === this.name && (!type || creep.memory.type === type)) {
				creeps.push(creep);
			}
		}
		return _.sortBy(creeps, "name");
	}

	protected countSources(a: Room, b: INestRoom): number {
		let sources = _.get<number>(b, "contains.valuables.sources", null);
		if (sources === null) {
			sources = a.find(FIND_SOURCES).length;
			_.get(b, "contains.valuables.sources", sources);
		}
		return sources;
	}
	protected countSourcePoints(a: Room, b: INestRoom): number {
		let points: number = _.get(b, "contains.valuables.source_points", null);
		if (points === null) {
			points = 0;
			let sources = a.find(FIND_SOURCES);
			_.forEach(sources, (source: Source) => {
				for(var i = 0; i<3; i++) {
					for(var j = 0; j<3; j++) {
						let x = (source.pos.x - 1) + i;
						let y = (source.pos.y - 1) + j;
						if(!_.includes(a.lookForAt(LOOK_TERRAIN, x, y), "wall")) {
							points++;
						}
					}
				}
			});
		}

		return points;
	}
	protected countEnemySpawns(a: Room): number {
		return a.find(FIND_HOSTILE_SPAWNS).length;
	}
	protected countEnemyCreeps(a: Room): number {
		return a.find(FIND_HOSTILE_CREEPS).length;
	}
	protected countEnemyMilitary(a: Room): number {
		return 0;
	}
	protected countAllySpawns(a: Room): number {
		return 0;
	}
	protected countAllyCreeps(a: Room): number {
		return 0;
	}
	protected countAllyMilitary(a: Room): number {
		return 0;
	}
	protected countMySpawns(a: Room): number {
		return a.find(FIND_MY_SPAWNS).length;
	}
	protected countMyCreeps(a: Room): number {
		return a.find(FIND_MY_CREEPS).length;
	}
	protected countMyMilitary(a: Room): number {
		return 0;
	}

	protected buildMissingCreeps() {
		let spawning = false;
		_.forEach(_.filter(this.rooms, (room) => {return room.contains.my.spawn}), (b: INestRoom) => {
			let a: Room = Game.rooms[b.name];
			if (!spawning && a) {

			}
	    const spawns: Spawn[] = a.find<Spawn>(FIND_MY_SPAWNS, {
	        filter: (spawn: Spawn) => !spawn.spawning
	    });

	    const containers: StructureContainer[] = a.find<StructureContainer>(FIND_STRUCTURES, {
	        filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER,
	    });

	    if (spawns.length) {
	        let melees     = _.filter(Game.creeps, (creep) => {return creep.memory.room === a.name && creep.memory.type === "melee"});
	        let workers    = _.filter(Game.creeps, (creep) => {return creep.memory.room === a.name && creep.memory.type === "worker"});
	        let miners     = _.filter(Game.creeps, (creep) => {return creep.memory.room === a.name && creep.memory.type === "miner"});
	        let haulers    = _.filter(Game.creeps, (creep) => {return creep.memory.room === a.name && creep.memory.type === "hauler"});
	        let energizers = _.filter(Game.creeps, (creep) => {return creep.memory.room === a.name && creep.memory.type === "energizer"});
	        let harvesters = _.filter(Game.creeps, (creep) => {return creep.memory.room === a.name && creep.memory.type === "harvester"});

	        let type:string = null;

	        if (workers.length < (containers.length > 1 ? 5 : 8)) {
	            type = "worker"
	        }
	        if (workers.length > 0) {
	            if (melees.length < 3) {
	            	type = "melee";
	            }
	            if (harvesters.length < _.filter(_.values(Plans.rooms), (i) => i === Plans.HARVEST_SOURCES).length * 3) {
	                type = "harvester"
	            }
	            if (haulers.length < Math.ceil(containers.length/2)) {
	                type = "hauler";
	            }
	            if (miners.length < (containers.length > 1 ? 3 : 0)) {
	                type = "miner";
	            }
	            if (energizers.length < 1) {
	                type = "energizer"
	            }
	        }

	        let level = a.controller.level;
	        let result = null;
	        while (type && level > 0 && !_.isString(result)) {
	            switch(type) {
	                case "worker":
	                    result = WorkerCreep.createCreep(a, level);
	                    break;
	                case "melee":
	                    result = MeleeCreep.createCreep(a, level);
	                    break;
	                case "miner":
	                    result = MinerCreep.createCreep(a, level);
	                    break;
	                case "hauler":
	                    result = HaulerCreep.createCreep(a, level);
	                    break;
	                case "energizer":
	                    result = EnergizerCreep.createCreep(a, level);
	                    break;
	                case "harvester":
	                    result = HarvesterCreep.createCreep(a, level);
	                    break;
	            }

	            if (_.isString(result)) {
	                console.log("Spawning", type, "at level", level);
	            } else {
	                level--;
	            }
	        }
	    }
	}
} 
