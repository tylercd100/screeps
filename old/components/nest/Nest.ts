/*
* @Author: Tyler Arbon
* @Date:   2017-07-31 19:58:29
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-05 23:29:13
*/

'use strict';

import {WorkerCreep} from "./../creeps/types/WorkerCreep";
import {ReserverCreep} from "./../creeps/types/ReserverCreep";
import {MeleeCreep} from "./../creeps/types/MeleeCreep";
import {RangeCreep} from "./../creeps/types/RangeCreep";
import {ScoutCreep} from "./../creeps/types/ScoutCreep";
import {MinerCreep} from "./../creeps/types/MinerCreep";
import {HaulerCreep} from "./../creeps/types/HaulerCreep";
import {EnergizerCreep} from "./../creeps/types/EnergizerCreep";
import {HarvesterCreep} from "./../creeps/types/HarvesterCreep";
import {TowerManager} from "./../towers/TowerManager";
import {LinkManager} from "./../links/LinkManager";
import * as Config from "./../../config/config";
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
		safeMode: boolean;
		exits: {
			top: boolean;
			right: boolean;
			left: boolean;
			bottom: boolean;
		}
		valuables: {
			sources: number;
			source_points: number;
		}
		enemy: {
			spawn: boolean;
			creeps: number;
			towers: number;
			controller: boolean;
			military: number;
		}
		ally: {
			spawn: boolean;
			creeps: number;
			towers: number;
			controller: boolean;
			military: number;
		}
		my: {
			spawn: boolean;
			creeps: number;
			towers: number;
			controller: boolean;
			military: number;
		}
	}
}

export interface INestRoomNeeds {
	harvester: number;
	melee: number;
	[type: string]: number;
}

export class Nest implements INest {
	maxRooms: number = 32;
	constructor(public name: string, public rooms: INestRoom[]) {}

	run() {
		_.forEach(this.getCreeps(), (creep: Creep) => {
			if(!_.find(this.rooms, {name: creep.room.name})) {
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

		if(Game.time % 3 === 0) {
			this.recordRoomContents();
		}
		if(Game.time % 10 === 0) {
			this.assignRooms();
			this.assignCreeps();
			this.markRoomsForScouting()
		}
		this.drawPlans();
		this.buildMissingCreeps();

		_.forEach(this.rooms, (b: INestRoom) => {
			let a: Room = Game.rooms[b.name];

			if (a) {
				(new TowerManager()).run(a);
				(new LinkManager()).run(a);
			}
		});

		this.runCreeps();
	}

	protected assignRooms() {
		let maxHarvest = this.getLevel() + 1;
		let cntHarvest = 0;

		_.forEach(this.rooms, (room: INestRoom) => {
			
			let controller = _.get<StructureController>(Game.rooms[room.name], "controller");

			let oldMilitary = room.plans.military;
			let oldIndustry = room.plans.industry;

			// military
			let hasAllySpawn    = _.get(room, "contains.ally.spawn");
			let hasEnemyController = _.get(room, "contains.enemy.controller");
			let hasEnemyCreeps  = _.get(room, "contains.enemy.creeps") > 0;
			let hasEnemyLairs   = _.get(room, "contains.enemy.lairs") > 0;
			let hasEnemyTowers  = _.get(room, "contains.enemy.towers") > 0;
			let hasEnemySpawn   = _.get(room, "contains.enemy.spawn");
			let hasMyCreeps     = _.get(room, "contains.my.creeps") > 0;
			let hasMySpawn      = _.get(room, "contains.my.spawn");
			let hasSourcePoints = _.get(room, "contains.valuables.source_points") > 0;

			
			if(!_.get(room, "contains") || Game.time - room.contains.updated_at > 1200 || (Game.time - room.contains.updated_at > 100 && hasAllySpawn)) {
				room.plans.military = Plans.SCOUT;
			} else if (!room.contains.safeMode && hasEnemyCreeps && !hasEnemyLairs && !hasEnemySpawn && (hasAllySpawn || hasMySpawn || hasMyCreeps || room.plans.industry === Plans.HARVEST_SOURCES)) {
				room.plans.military = Plans.DEFEND;
			} else if (!room.contains.safeMode && !hasEnemyTowers && !hasEnemyLairs && (hasEnemyController || hasEnemyCreeps || hasEnemySpawn)) {
				if(room.plans.military !== Plans.PREPARE && room.plans.military !== Plans.ATTACK) {
					room.plans.military = Plans.PREPARE;
					if(oldMilitary !== room.plans.military)
						Game.notify("The nest is preparing for attack against "+room.name);
				} else if(this.isDonePreparing(room)) {
					room.plans.military = Plans.ATTACK; //Needs to be attack
					if(oldMilitary !== room.plans.military)
						Game.notify("The nest is attacking room "+room.name);
				}
			} else if(!(room.plans.military === Plans.RESERVE && controller && !controller.my && _.get(controller, "reservation.ticksToEnd", 0) < 1500)) {
				room.plans.military = Plans.IGNORE;
			}

			if(room.plans.industry !== Plans.BASE) {
				// industry
				if(cntHarvest < maxHarvest && hasSourcePoints && room.plans.military !== Plans.ATTACK && room.plans.military !== Plans.DEFEND) {
					room.plans.industry = Plans.HARVEST_SOURCES;
					if(controller && !controller.my && _.get(controller, "reservation.ticksToEnd", 0) < 500) {
						room.plans.military = Plans.RESERVE;
					}
					cntHarvest++;
				} else {
					room.plans.industry = Plans.IGNORE;
				}
			}

			// Change updated at
			if(oldMilitary !== room.plans.military || oldIndustry !== room.plans.industry) {
				room.updated_at = Game.time;
			}
			
		});
	}



	protected assignCreeps() {
		let needs = {};
		let creeps = this.getCreeps();
		_.forEach(creeps, (creep: Creep) => {
			creep.memory._station = creep.memory.station;
		});

		// console.log("******Removal*******");
		_.forEach(this.rooms, (room) => {
			needs[room.name] = this.getNeededCreepCounts(room, false);

			for(const type in needs[room.name]) {
				let stationedCreeps = _.filter(creeps, (c) => c.memory.type === type && c.memory.station === room.name);
				if(stationedCreeps.length) {
					console.log(room.name, stationedCreeps.length, "stationed", type, "creeps");
				}
				_.forEach(stationedCreeps, (creep) => {
					if(needs[room.name][type] > 0) {
						console.log(room.name, "Keeping", type, "creep:", creep.name);
						needs[room.name][type]--;
					} else {
						console.log(room.name, "Removing", type, "creep:", creep.name);
						creep.memory.station = null;
					}
				});

			}
		});

		_.forEach(this.rooms, (room) => {
			_.forEach(creeps, (creep: Creep) => {
				if(!creep.memory.station) {
					for(const type in needs[room.name]) {
						if (creep.memory.type === type && needs[room.name][type] > 0) {
							console.log(room.name, "Assigning", type, "creep:", creep.name);
							creep.memory.station = room.name;
							needs[room.name][type]--;
						}
					}
				}
			});
		});

		_.forEach(creeps, (creep: Creep) => {
			if(!creep.memory.station) {
				creep.memory.station = this.name;
				creep.memory.assigned = false;
			} else {
				creep.memory.assigned = true;
			}

			// reset the task if the station has changed
			if(creep.memory._station !== creep.memory.station) {
				console.log(creep.name, "is moving from", creep.memory._station, "to", creep.memory.station);
				creep.memory.task = null;
			}

			delete creep.memory._station;
		});
	}

	protected recordRoomContents() {
		_.forEach(this.rooms, (b: INestRoom) => {
			let a: Room = Game.rooms[b.name];

			if (a) {
				let creep: Creep = _.first(a.find(FIND_MY_CREEPS));
				b.contains = _.merge(b.contains || {}, {
					updated_at: Game.time,
					safeMode: _.get(a, "controller.safeMode", 0) > 0,
					valuables: {
						sources: this.countSources(a, b),
						source_points: this.countSourcePoints(a, b),
					},
					enemy: {
						spawn: this.countEnemySpawns(a) > 0,
						controller: this.countEnemyController(a) > 0,
						creeps: this.countEnemyCreeps(a),
						towers: this.countEnemyTowers(a),
						military: this.countEnemyMilitary(),
						lairs: this.countEnemySourceKeeperLairs(a),
					},
					ally: {
						spawn: this.countAllySpawns(a) > 0,
						controller: this.countAllyController(a) > 0,
						creeps: this.countAllyCreeps(a),
						towers: this.countAllyTowers(a),
						military: this.countAllyMilitary(),
					},
					my: {
						spawn: this.countMySpawns(a) > 0,
						controller: this.countMyController(a) > 0,
						creeps: this.countMyCreeps(a),
						towers: this.countMyTowers(a),
						military: this.countMyMilitary(),
					},
					exits: {
						// top: !!_.first(a.find<Room>(FIND_EXIT_TOP)),
						// right: !!_.first(a.find<Room>(FIND_EXIT_RIGHT)),
						// bottom: !!_.first(a.find<Room>(FIND_EXIT_BOTTOM)),
						// left: !!_.first(a.find<Room>(FIND_EXIT_LEFT)),
						top: this.findExitTo(a, creep, FIND_EXIT_TOP),
						right: this.findExitTo(a, creep, FIND_EXIT_RIGHT),
						bottom: this.findExitTo(a, creep, FIND_EXIT_BOTTOM),
						left: this.findExitTo(a, creep, FIND_EXIT_LEFT),
					},
				});
			}
		});
	}

	getLevel() {
		return Game.rooms[this.name].controller.level
	}

	roomNameToWorldCoords(name: string): {x:number, y:number} {
		if(!name) return;
		let parts = name.match(/^([NESW])(\d+)([NESW])(\d+)$/);
		let x = (parts[1] === "E" ? parseInt(parts[2]) : parseInt(parts[2])*-1);
		let y = (parts[3] === "N" ? parseInt(parts[4]) : parseInt(parts[4])*-1);
		return {x: x, y: y};
	}

	worldCoordsToRoomName(coords: {x:number, y:number}): string {
		let name: string ="";
		name += (coords.x>0 ? "E" : "W") + coords.x;
		name += (coords.y>0 ? "N" : "S") + coords.y;
		return name;
	}

	getRoomNeighborName(name: string, direction: number) {
		let coords: {x:number, y:number} = this.roomNameToWorldCoords(name);
		switch (direction) {
			case TOP_RIGHT:
				coords.x++;
				coords.x++;
			case TOP_LEFT:
				coords.x--;
			case TOP:
				coords.y++;
				break;
			case BOTTOM_RIGHT:
				coords.x++;
				coords.x++;
			case BOTTOM_LEFT:
				coords.x--;
			case BOTTOM:
				coords.y--;
				break;
			case RIGHT:
				coords.x++;
				break;
			case LEFT:
				coords.x--;
				break;
		}

		return this.worldCoordsToRoomName(coords);
	}

	protected markRoomsForScouting() {
		_.forEach(this.rooms, (room: INestRoom) => {
			let name: string;
			let coords = this.roomNameToWorldCoords(room.name);
			if(_.get(room, "contains.exits.top")) {
				name = this.getRoomNeighborName(room.name, TOP);
				if(Game.map.isRoomAvailable(name)) {
					this.addRoom(name, Plans.IGNORE, Plans.SCOUT);
				}
			}
			if(_.get(room, "contains.exits.bottom")) {
				name = this.getRoomNeighborName(room.name, BOTTOM);
				if(Game.map.isRoomAvailable(name)) {
					this.addRoom(name, Plans.IGNORE, Plans.SCOUT);
				}
			}
			if(_.get(room, "contains.exits.left")) {
				name = this.getRoomNeighborName(room.name, LEFT);
				if(Game.map.isRoomAvailable(name)) {
					this.addRoom(name, Plans.IGNORE, Plans.SCOUT);
				}
			}
			if(_.get(room, "contains.exits.right")) {
				name = this.getRoomNeighborName(room.name, RIGHT);
				if(Game.map.isRoomAvailable(name)) {
					this.addRoom(name, Plans.IGNORE, Plans.SCOUT);
				}
			}

		});
	}

	protected drawPlans() {
		_.forEach(this.rooms, (room) => {
			let opts = {align: 'left', color: 'white', font: 0.8};
			if(room && room.plans) {

				switch(room.plans.military) {
					case Plans.BASE:
						new RoomVisual(room.name).text("Military: BASE", 0, 1, opts);
						break;
					case Plans.ATTACK:
						new RoomVisual(room.name).text("Military: ATTACK", 0, 1, opts);
						break;
					case Plans.PREPARE:
						new RoomVisual(room.name).text("Military: PREPARE", 0, 1, opts);
						break;
					case Plans.DEFEND:
						new RoomVisual(room.name).text("Military: DEFEND", 0, 1, opts);
						break;
					case Plans.SCOUT:
						new RoomVisual(room.name).text("Military: SCOUT", 0, 1, opts);
						break;
					case Plans.RESERVE:
						new RoomVisual(room.name).text("Military: RESERVE", 0, 1, opts);
						break;
					default:
						new RoomVisual(room.name).text("Military: IGNORE", 0, 1, opts);
						break;
				}
				switch(room.plans.industry) {
					case Plans.BASE:
						new RoomVisual(room.name).text("Industry: BASE", 0, 2, opts);
						break;
					case Plans.HARVEST_SOURCES:
						new RoomVisual(room.name).text("Industry: HARVEST_SOURCES", 0, 2, opts);
						break;
					default:
						new RoomVisual(room.name).text("Industry: IGNORE", 0, 2, opts);
						break;
				}
			}
		})
	}

	protected runCreeps() {
		this.getCreeps().forEach((creep: Creep) => {
            switch (creep.memory.type) {
                case 'worker':
                    new WorkerCreep(creep).run();
                    break;
                case 'reserver':
                    new ReserverCreep(creep).run();
                    break;
                case 'melee':
                    new MeleeCreep(creep).run();
                    break;
                case 'range':
                    new RangeCreep(creep).run();
                    break;
                case 'miner':
                    new MinerCreep(creep).run();
                    break;
                case 'scout':
                    new ScoutCreep(creep).run();
                    break;
                case 'hauler':
                    new HaulerCreep(creep).run();
                    break;
                case 'energizer':
                    new EnergizerCreep(creep).run();
                    break;
                case 'harvester':
                    new HarvesterCreep(creep).run();
                    break;
                default:
                    console.log("Unknown type for creep:", creep.name);
                    break;
            }
		});
	}



	protected findExitTo(room: Room, creep: Creep, find: number) {
		let exitPositions: RoomPosition[] = room.find<RoomPosition>(find);
		let exit = _.first(exitPositions);

		if(!exit) return false;

		let path = PathFinder.search(creep.pos, exit, {
			maxRooms: 1,
			roomCallback: function(roomName) {

		        let room = Game.rooms[roomName];
		        // In this example `room` will always exist, but since
		        // PathFinder supports searches which span multiple rooms
		        // you should be careful!
		        if (!room) return;
		        let costs = new PathFinder.CostMatrix;

		        room.find(FIND_STRUCTURES).forEach(function(struct: Structure) {
		          if (struct.structureType === STRUCTURE_ROAD) {
		            // Favor roads over plain tiles
		            costs.set(struct.pos.x, struct.pos.y, 1);
		          } else if (struct.structureType !== STRUCTURE_CONTAINER &&
		                     (struct.structureType !== STRUCTURE_RAMPART ||
		                      !struct.my)) {
		            // Can't walk through non-walkable buildings
		            costs.set(struct.pos.x, struct.pos.y, 0xff);
		          }
		        });

		        // Avoid creeps in the room
		        room.find(FIND_CREEPS).forEach(function(creep: Creep) {
		          costs.set(creep.pos.x, creep.pos.y, 0xff);
		        });

		        return costs;
		    },
		});

		return !path.incomplete;
	}



	addRoom(name: string, planIndustry: number, planMilitary: number) {
		if(!name) return;
		if(!_.find(this.rooms, {name: name}) && this.rooms.length < this.maxRooms) {
			console.log("***** ADDING ROOM TO THE NEST: "+name+" *****")
			this.rooms.push({
				name: name,
				updated_at: Game.time,
				plans: {
					industry: planIndustry,
					military: planMilitary,
				}
			});
		}
	}

	getMilitaryTypes(): string[] {
		return ["heal", "melee", "range"];
	}

	protected isDonePreparing(room: INestRoom): boolean {
		if (room.plans.military !== Plans.PREPARE) {
			return true;
		}
		
		let copy = _.cloneDeep(room);
		copy.plans.military = Plans.ATTACK;

		let needs = this.getNeededCreepCounts(copy, false);
		let types = this.getMilitaryTypes();
		let done = true;
		_.forEach(types, (type) => {
			done = done && this.getUnassignedCreepCount(type) === needs[type];
		})
		return done;
	}

	protected getUnassignedCreepCount(type: string) {
		return _.filter(Game.creeps, (c: Creep) => c.memory.type === type && c.memory.assigned === false).length;
	}

	protected getNeededCreepCounts(room: INestRoom, spawning: boolean): INestRoomNeeds {
		return {
			"heal": 0,
			"harvester": this.getNeededHarvesterCreepCount(room, spawning),
			"melee": this.getNeededMeleeCreepCount(room, spawning),
			"range": this.getNeededRangeCreepCount(room, spawning),
			"scout": _.min([Math.ceil(this.getNeededScoutCreepCount(room, spawning)/2), 4]),
			"reserver": this.getNeededReserverCreepCount(room, spawning),
		}
	}

	protected getNeededHarvesterCreepCount(room: INestRoom, spawning: boolean = true): number {
		if (_.get<number>(room, "plans.industry", Plans.IGNORE) === Plans.HARVEST_SOURCES) {
			let x = _.min([
				_.get<number>(room, "contains.valuables.sources", 0) * 2,
				_.get<number>(room, "contains.valuables.source_points", 0)
			]);
			return x;
		}
		return 0;
	}

	protected getTotalNeededHarvesterCreepCount(spawning: boolean = true): number {
		return _.sum(_.map(this.rooms, (r) => this.getNeededHarvesterCreepCount(r, spawning)));
	}

	protected getNeededMeleeCreepCount = (room: INestRoom, spawning: boolean = true): number => {
		let plan = _.get<number>(room, "plans.military", Plans.IGNORE)
		let hasAttackPlan = this.getPlanAttackCount();
		switch (plan) {
			case Plans.PREPARE:
				return spawning ? 3 : 0;
			case Plans.ATTACK:
				return 3;
			case Plans.DEFEND:
				return hasAttackPlan > 0 ? 0 : 1;
		}
		return 0;
	}

	protected getTotalNeededMeleeCreepCount(spawning: boolean = true): number {
		return _.sum(_.map(this.rooms, (r) => this.getNeededMeleeCreepCount(r, spawning)));
	}

	protected getNeededRangeCreepCount = (room: INestRoom, spawning: boolean = true): number => {
		let plan = _.get<number>(room, "plans.military", Plans.IGNORE)
		let hasAttackPlan = this.getPlanAttackCount();
		switch (plan) {
			case Plans.PREPARE:
				return spawning ? 3 : 0;
			case Plans.ATTACK:
				return 3;
			case Plans.DEFEND:
				return hasAttackPlan > 0 ? 0 : 2;
		}
		return 0;
	}

	protected getTotalNeededRangeCreepCount(spawning: boolean = true): number {
		return _.sum(_.map(this.rooms, (r) => this.getNeededRangeCreepCount(r, spawning)));
	}

	protected getNeededReserverCreepCount(room: INestRoom, spawning: boolean = true): number {
		let plan = _.get<number>(room, "plans.military", Plans.IGNORE)
		if (_.includes([Plans.RESERVE], plan)) {
			return 2;
		}
		return 0;
	}

	protected getTotalNeededReserverCreepCount(spawning: boolean = true): number {
		return _.sum(_.map(this.rooms, (r) => this.getNeededReserverCreepCount(r, spawning)));
	}

	protected getNeededScoutCreepCount = (room: INestRoom, spawning: boolean = true): number => {
		let plan = _.get<number>(room, "plans.military", Plans.IGNORE)
		let hasAttackPlan = this.getPlanAttackCount();
		if (_.includes([Plans.SCOUT], plan)) {
			return hasAttackPlan > 0 ? 0 : 1;
		}
		return 0;
	}

	protected getTotalNeededScoutCreepCount(spawning: boolean = true): number {
		return _.sum(_.map(this.rooms, (r) => this.getNeededScoutCreepCount(r, spawning)));
	}

	protected getSourcePointCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isHarvestSourcePlan = _.get<number|null>(r, "plans.industry", null) === Plans.HARVEST_SOURCES;
			return isHarvestSourcePlan ? _.get<number>(r, "valuables.source_points", 0) : 0;
		}));
	}

	protected getPlanHarvestSourcesCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isHarvestSourcePlan = _.get<number|null>(r, "plans.industry", null) === Plans.HARVEST_SOURCES;
			return isHarvestSourcePlan ? 1 : 0;
		}));
	}

	protected getPlanAttackCount(): number {
		return _.sum(_.map(this.rooms, (r) => {
			let isAttackPlan = _.get<number|null>(r, "plans.military", null) === Plans.ATTACK;
			return isAttackPlan ? 1 : 0;
		}));
	}

	protected getCreeps(type: string|null = null): Creep[] {
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
		let sources = _.get<number|null>(b, "contains.valuables.sources", null);
		if (sources === null) {
			sources = a.find(FIND_SOURCES).length;
			_.get(b, "contains.valuables.sources", sources);
		}
		return sources;
	}
	protected countSourcePoints(a: Room, b: INestRoom): number {
		let points: number|null = _.get(b, "contains.valuables.source_points", null);
		if (points === null) {
			let count = 0;
			let sources = a.find(FIND_SOURCES);
			_.forEach(sources, (source: Source) => {
				for(var i = 0; i<3; i++) {
					for(var j = 0; j<3; j++) {
						let x = (source.pos.x - 1) + i;
						let y = (source.pos.y - 1) + j;
						if(!_.includes(a.lookForAt(LOOK_TERRAIN, x, y), "wall")) {
							count++;
						}
					}
				}
			});

			points = count;
		}

		return points;
	}
	protected countEnemySpawns(a: Room): number {
		return a.find(FIND_HOSTILE_SPAWNS, {filter: (c: Spawn) => _.indexOf(Config.FRIENDS, c.owner.username) < 0}).length;
	}
	protected countEnemyController(a: Room): number {
		return a.controller && a.controller.owner && _.indexOf(Config.FRIENDS, a.controller.owner.username) < 0 ? 1 : 0;
	}
	protected countEnemyCreeps(a: Room): number {
		return a.find(FIND_HOSTILE_CREEPS, {filter: (c: Creep) => _.indexOf(Config.FRIENDS, c.owner.username) < 0}).length;
	}
	protected countEnemyTowers(a: Room): number {
		return a.find(FIND_STRUCTURES, {filter: (c: StructureTower) => c.structureType === STRUCTURE_TOWER && _.indexOf(Config.FRIENDS, c.owner.username) < 0}).length;
	}
	protected countEnemySourceKeeperLairs(a: Room): number {
		return a.find(FIND_STRUCTURES, {filter: (c: StructureKeeperLair) => c.structureType === STRUCTURE_KEEPER_LAIR}).length;
	}
	protected countEnemyMilitary(): number {
		return 0;
	}
	protected countAllySpawns(a: Room): number {
		return a.find(FIND_HOSTILE_SPAWNS, {filter: (c: Spawn) => _.indexOf(Config.FRIENDS, c.owner.username) >= 0}).length;
	}
	protected countAllyController(a: Room): number {
		return a.controller && a.controller.owner && _.indexOf(Config.FRIENDS, a.controller.owner.username) >= 0 ? 1 : 0;
	}
	protected countAllyCreeps(a: Room): number {
		return a.find(FIND_HOSTILE_CREEPS, {filter: (c: Creep) => _.indexOf(Config.FRIENDS, c.owner.username) >= 0}).length;
	}
	protected countAllyTowers(a: Room): number {
		return a.find(FIND_STRUCTURES, {filter: (c: StructureTower) => c.structureType === STRUCTURE_TOWER && _.indexOf(Config.FRIENDS, c.owner.username) >= 0}).length;
	}
	protected countAllyMilitary(): number {
		return 0;
	}
	protected countMySpawns(a: Room): number {
		return a.find(FIND_MY_SPAWNS).length;
	}
	protected countMyController(a: Room): number {
		return a.controller && a.controller.my ? 1 : 0;
	}
	protected countMyCreeps(a: Room): number {
		return a.find(FIND_MY_CREEPS).length;
	}
	protected countMyTowers(a: Room): number {
		return a.find(FIND_STRUCTURES, {filter: (c: StructureTower) => c.structureType === STRUCTURE_TOWER && _.indexOf(["Tarbonator"], c.owner.username) < 0}).length;
	}
	protected countMyMilitary(): number {
		return 0;
	}

	protected buildMissingCreeps() {
		let spawning = false;
		_.forEach(this.rooms, (b: INestRoom) => {
			let a: Room = Game.rooms[b.name];
			if (!spawning && a && b.plans.industry === Plans.BASE) {
				const spawns: Spawn[] = a.find<Spawn>(FIND_MY_SPAWNS, {
				    filter: (spawn: Spawn) => !spawn.spawning
				});

				const containers: StructureContainer[] = a.find<StructureContainer>(FIND_STRUCTURES, {
				    filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER,
				});

				if (spawns.length) {

					let spawn = _.first(spawns);

				    let melees     = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "melee" && creep.ticksToLive > 100});
				    let ranges     = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "range" && creep.ticksToLive > 100});
				    let scouts     = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "scout" && creep.ticksToLive > 100});
				    let workers    = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "worker" && creep.ticksToLive > 100});
				    let miners     = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "miner" && creep.ticksToLive > 100});
				    let haulers    = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "hauler" && creep.ticksToLive > 100});
				    let energizers = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "energizer" && creep.ticksToLive > 100});
				    let harvesters = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "harvester" && creep.ticksToLive > 100});
				    let reservers  = _.filter(Game.creeps, (creep) => {return creep.memory.nest === a.name && creep.memory.type === "reserver" && creep.ticksToLive > 100});

				    let type:string|null = null;

				    if (workers.length < (containers.length > 1 ? 5 : 8)) {
				        type = "worker"
				    } else {
				    	// Tries to maintain a leveled rotation of these creep types
				    	let rotation = [
				    		{type: "harvester", count: harvesters.length/3, need: harvesters.length < this.getTotalNeededHarvesterCreepCount(true)},
				    		{type: "reserver", count: reservers.length, need: reservers.length < this.getTotalNeededReserverCreepCount(true)},
				    		{type: "melee", count: melees.length, need: melees.length < this.getTotalNeededMeleeCreepCount(true)},
				    		{type: "range", count: ranges.length, need: ranges.length < this.getTotalNeededRangeCreepCount(true)},
				    	];
				    	let chosen = _.reduce(_.filter(rotation, {need: true}), (choice, item) => {
				    		if(!choice || item.count<=choice.count) {
				    			choice = item;
				    		}
				    		return choice;
				    	}, null);
				    	if(chosen) {
				    		console.log("I CHOSE YOU", chosen.type)
				    		type = chosen.type;
				    	}

				    	// Standard
				        if (scouts.length < this.getTotalNeededScoutCreepCount(true)) {
				        	type = "scout";
				        }
				        if (haulers.length < Math.ceil(containers.length/2)) {
				            type = "hauler";
				        }
				        if (miners.length < (containers.length > 1 ? 3 : 0)) {
				            type = "miner";
				        }
				        if (energizers.length < Math.floor(a.controller.level/2)) {
				            type = "energizer"
				        }
				    }

				    let level = _.get<number>(a, "controller.level", 0);
				    let result = null;
				    while (type && level > 0 && !_.isString(result)) {
				        switch(type) {
				            case "worker":
				                result = WorkerCreep.createCreep(spawn, this, level);
				                break;
				            case "reserver":
				                result = ReserverCreep.createCreep(spawn, this, level);
				                break;
				            case "melee":
				                result = MeleeCreep.createCreep(spawn, this, level);
				                break;
				            case "range":
				                result = RangeCreep.createCreep(spawn, this, level);
				                break;
				            case "scout":
				                result = ScoutCreep.createCreep(spawn, this, level);
				                break;
				            case "miner":
				                result = MinerCreep.createCreep(spawn, this, level);
				                break;
				            case "hauler":
				                result = HaulerCreep.createCreep(spawn, this, level);
				                break;
				            case "energizer":
				                result = EnergizerCreep.createCreep(spawn, this, level);
				                break;
				            case "harvester":
				                result = HarvesterCreep.createCreep(spawn, this, level);
				                break;
				        }

				        if (_.isString(result)) {
				            console.log("****** Spawning", type, "at level", level, "******");
				        } else if(_.includes(["hauler", "melee", "range", "miner"], type)) {
				        	level = 0;
				        } else {
				            level--;
				        }
				    }
				}
			}
		});
	}
}
