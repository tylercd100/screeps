/*
* @Author: Tyler Arbon
* @Date:   2017-07-31 19:58:29
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-01 00:44:59
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
	}

	recordRoomContents() {
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

	assignRooms() {
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

	assignCreeps() {
		let creeps = this.getCreeps();
		let roomCount: number = this.getPlanHarvestSourcesCount();
		_.forEach(creeps, (creep: Creep) => {
		})
		this.assignHarvesters();
	}

	assignHarvesters() {
		this.getSourcePointCount();
	}

	getSourcePointCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isHarvestSourcePlan = _.get<number>(r, "plans.industry", null) === Plans.HARVEST_SOURCES;
			return isHarvestSourcePlan ? _.get<number>(r, "valuables.source_points", 0) : 0;
		}));
	}

	getPlanHarvestSourcesCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isHarvestSourcePlan = _.get<number>(r, "plans.industry", null) === Plans.HARVEST_SOURCES;
			return isHarvestSourcePlan ? 1 : 0;
		}));
	}

	getCreeps(type: string = null): Creep[] {
		let creeps: Creep[] = [];
		for(const name in Game.creeps) {
			let creep = Game.creeps[name];
			if (creep.memory.nest === this.name && (!type || creep.memory.type === type)) {
				creeps.push(creep);
			}
		}
		return _.sortBy(creeps, "name");
	}

	countSources(a: Room, b: INestRoom): number {
		let sources = _.get<number>(b, "contains.valuables.sources", null);
		if (sources === null) {
			sources = a.find(FIND_SOURCES).length;
			_.get(b, "contains.valuables.sources", sources);
		}
		return sources;
	}
	countSourcePoints(a: Room, b: INestRoom): number {
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
	countEnemySpawns(a: Room): number {
		return a.find(FIND_HOSTILE_SPAWNS).length;
	}
	countEnemyCreeps(a: Room): number {
		return a.find(FIND_HOSTILE_CREEPS).length;
	}
	countEnemyMilitary(a: Room): number {
		return 0;
	}
	countAllySpawns(a: Room): number {
		return 0;
	}
	countAllyCreeps(a: Room): number {
		return 0;
	}
	countAllyMilitary(a: Room): number {
		return 0;
	}
	countMySpawns(a: Room): number {
		return a.find(FIND_MY_SPAWNS).length;
	}
	countMyCreeps(a: Room): number {
		return a.find(FIND_MY_CREEPS).length;
	}
	countMyMilitary(a: Room): number {
		return 0;
	}
} 