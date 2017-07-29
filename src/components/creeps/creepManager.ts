import {WorkerCreep} from "./types/WorkerCreep";
import {MinerCreep} from "./types/MinerCreep";
import {HaulerCreep} from "./types/HaulerCreep";
import {EnergizerCreep} from "./types/EnergizerCreep";

export class CreepManager {
    creeps: Creep[];
    creepCount: number = 0;

    run(room: Room): void {
        this.creeps = room.find<Creep>(FIND_MY_CREEPS);
        this.creepCount = _.size(this.creeps);
        this.buildMissingCreeps(room);

        for(const name in this.creeps) {
            let creep = this.creeps[name];
            switch (creep.memory.type) {
                case 'worker':
                    new WorkerCreep(room, creep).run();
                    break;
                case 'miner':
                    new MinerCreep(room, creep).run();
                    break;
                case 'hauler':
                    new HaulerCreep(room, creep).run();
                    break;
                case 'energizer':
                    new EnergizerCreep(room, creep).run();
                    break;
                default:
                    console.log("Unknown type for creep:", creep.name);
                    break;
            }
        }
    }

    protected buildMissingCreeps(room: Room) {
        const spawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
            filter: (spawn: Spawn) => !spawn.spawning
        });

        const containers: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {
            filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER,
        });

        if (spawns.length) {
    
            let workers    = _.filter(this.creeps, (creep) => creep.memory.type === "worker");
            let miners     = _.filter(this.creeps, (creep) => creep.memory.type === "miner");
            let haulers    = _.filter(this.creeps, (creep) => creep.memory.type === "hauler");
            let energizers = _.filter(this.creeps, (creep) => creep.memory.type === "energizer");

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
                if (energizers.length < 1) {
                    type = "energizer"
                }
            }

            let level = room.controller.level;
            let result = null;
            while (type && level > 0 && !_.isString(result)) {
                switch(type) {
                    case "worker":
                        result = WorkerCreep.createCreep(room, level);
                        break;
                    case "miner":
                        result = MinerCreep.createCreep(room, level);
                        break;
                    case "hauler":
                        result = HaulerCreep.createCreep(room, level);
                        break;
                    case "energizer":
                        result = EnergizerCreep.createCreep(room, level);
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
 
// /**
//  * Initialization scripts for CreepManager module.
//  *
//  * @export
//  * @param {Room} room
//  */
// export function run(room: Room): void {
    
// }

// /**
//  * Loads and counts all available creeps.
//  *
//  * @param {Room} room
//  */
// function _loadCreeps(room: Room) {
//     creeps = room.find<Creep>(FIND_MY_CREEPS);
//     creepCount = _.size(creeps);

//     // Iterate through each creep and push them into the role array.
//     harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
//     upgraders = _.filter(creeps, (creep) => creep.memory.role === "upgrader");
//     builders = _.filter(creeps, (creep) => creep.memory.role === "builder");

//     if (Config.ENABLE_DEBUG_MODE) {
//         log.info(creepCount + " creeps found in the playground.");
//     }
// }

// /**
//  * Creates a new creep if we still have enough space.
//  *
//  * @param {Room} room
//  */
// function _buildMissingCreeps(room: Room) {
//     let bodyParts: string[];

//     const spawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
//         filter: (spawn: Spawn) => {
//             return spawn.spawning === null;
//         },
//     });

//     if (Config.ENABLE_DEBUG_MODE) {
//         if (spawns[0]) {
//             log.info("Spawn: " + spawns[0].name);
//         }
//     }

//     if (room.energyCapacityAvailable <= 800) {
//         bodyParts = [WORK, WORK, CARRY, MOVE];
//     } else if (room.energyCapacityAvailable > 800) {
//         bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
//     }

//     if (harvesters.length < 3) {
//         _.each(spawns, (spawn: Spawn) => {
//             _spawnCreep(spawn, bodyParts, "harvester");
//         });
//     } else if (upgraders.length < 3) {
//         _.each(spawns, (spawn: Spawn) => {
//             _spawnCreep(spawn, bodyParts, "upgrader");
//         });
//     } else if (builders.length < 5) {
//         _.each(spawns, (spawn: Spawn) => {
//             _spawnCreep(spawn, bodyParts, "builder");
//         });
//     }
// }

// /**
//  * Spawns a new creep.
//  *
//  * @param {Spawn} spawn
//  * @param {string[]} bodyParts
//  * @param {string} role
//  * @returns
//  */
// function _spawnCreep(spawn: Spawn, bodyParts: string[], role: string) {
//     const uuid: number = Memory.uuid;
//     let status: number | string = spawn.canCreateCreep(bodyParts, undefined);

//     const properties: { [key: string]: any } = {
//         role,
//         room: spawn.room.name,
//     };

//     status = _.isString(status) ? OK : status;
//     if (status === OK) {
//         Memory.uuid = uuid + 1;
//         const creepName: string = spawn.room.name + " - " + role + uuid;

//         log.info("Started creating new creep: " + creepName);
//         if (Config.ENABLE_DEBUG_MODE) {
//             log.info("Body: " + bodyParts);
//         }

//         status = spawn.createCreep(bodyParts, creepName, properties);

//         return _.isString(status) ? OK : status;
//     } else {
//         if (Config.ENABLE_DEBUG_MODE) {
//             log.info("Failed creating new creep: " + status);
//         }

//         return status;
//     }
// }
