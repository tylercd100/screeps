/*
* @Author: Tyler Arbon
* @Date:   2017-07-28 23:45:43
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 00:14:26
*/

'use strict';

import {WorkerCreep} from "./../creeps/types/WorkerCreep";
import {MeleeCreep} from "./../creeps/types/MeleeCreep";
import {MinerCreep} from "./../creeps/types/MinerCreep";
import {HaulerCreep} from "./../creeps/types/HaulerCreep";
import {EnergizerCreep} from "./../creeps/types/EnergizerCreep";

export abstract class RoomPlan {
	creeps: Creep[];
	creepCount: number = 0;
	constructor(protected room: Room) {
		this.creeps = this.room.find<Creep>(FIND_MY_CREEPS);
		this.creepCount = _.size(this.creeps);
	}

	run() {
		for(const name in this.creeps) {
            let creep = this.creeps[name];
            switch (creep.memory.type) {
                case 'worker':
                    new WorkerCreep(this.room, creep).run();
                    break;
                case 'melee':
                    new MeleeCreep(this.room, creep).run();
                    break;
                case 'miner':
                    new MinerCreep(this.room, creep).run();
                    break;
                case 'hauler':
                    new HaulerCreep(this.room, creep).run();
                    break;
                case 'energizer':
                    new EnergizerCreep(this.room, creep).run();
                    break;
                default:
                    console.log("Unknown type for creep:", creep.name);
                    break;
            }
        }

        this.handle();
	}

	abstract handle();
}

export class DefendRoomPlan extends RoomPlan {
	handle() {
		
	}
}

export class AttackRoomPlan extends RoomPlan {
	handle() {
		
	}
}

export class IgnoreRoomPlan extends RoomPlan {
	handle() {
		
	}
}

export class BaseRoomPlan extends RoomPlan {
    handle() {
        this.buildMissingCreeps();
    }

    protected buildMissingCreeps() {
        const spawns: Spawn[] = this.room.find<Spawn>(FIND_MY_SPAWNS, {
            filter: (spawn: Spawn) => !spawn.spawning
        });

        const containers: StructureContainer[] = this.room.find<StructureContainer>(FIND_STRUCTURES, {
            filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER,
        });

        if (spawns.length) {
    
            let melees     = _.filter(Game.creeps, (creep) => creep.memory.type === "melee");
            let workers    = _.filter(Game.creeps, (creep) => creep.memory.type === "worker");
            let miners     = _.filter(Game.creeps, (creep) => creep.memory.type === "miner");
            let haulers    = _.filter(Game.creeps, (creep) => creep.memory.type === "hauler");
            let energizers = _.filter(Game.creeps, (creep) => creep.memory.type === "energizer");

            let type:string = null;

            if (workers.length < (containers.length > 1 ? 5 : 8)) {
                type = "worker"
            }
            if (workers.length > 0) {
                if (haulers.length < Math.ceil(containers.length/2)) {
                    type = "hauler";
                }
                if (miners.length < (containers.length > 1 ? 3 : 0)) {
                    type = "miner";
                }
                if (melees.length < 3) {
                	type = "melee";
                }
                if (energizers.length < 1) {
                    type = "energizer"
                }
            }

            let level = this.room.controller.level;
            let result = null;
            while (type && level > 0 && !_.isString(result)) {
                switch(type) {
                    case "worker":
                        result = WorkerCreep.createCreep(this.room, level);
                        break;
                    case "melee":
                        result = MeleeCreep.createCreep(this.room, level);
                        break;
                    case "miner":
                        result = MinerCreep.createCreep(this.room, level);
                        break;
                    case "hauler":
                        result = HaulerCreep.createCreep(this.room, level);
                        break;
                    case "energizer":
                        result = EnergizerCreep.createCreep(this.room, level);
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

// export class RoomOnePlan extends RoomPlan {
// handle	run() {
// 		let room: Room = this.room;
// 		let spawns: StructureSpawn[] = room.find<StructureSpawn>(FIND_MY_SPAWNS)
// 		let spawn: StructureSpawn = spawns.length > 0 ? spawns[0] : null;
// 		let resources = room.find(FIND_SOURCES);

// 		if (!spawn) {
// 			return false;
// 		}

// 		_.forEach(resources, (r: Resource) => {
// 			let path = spawn.pos.findPathTo(r.pos);
// 			_.forEach(path, (pos: PathStep) => {
// 				let p: RoomPosition = new RoomPosition(pos.x, pos.y, room.name);
// 				room.createConstructionSite(p, STRUCTURE_ROAD);
// 			});
// 		});

// 		return true;
// 	}
// }