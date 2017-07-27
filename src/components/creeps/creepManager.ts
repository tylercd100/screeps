import * as Config from "../../config/config";

import * as builder from "./roles/builder";
import * as harvester from "./roles/harvester";
import * as upgrader from "./roles/upgrader";

import { log } from "../../lib/logger/log";

export let creeps: Creep[];
export let creepCount: number = 0;
export let harvesters: Creep[] = [];
export let upgraders: Creep[] = [];
export let builders: Creep[] = [];

/**
 * Initialization scripts for CreepManager module.
 *
 * @export
 * @param {Room} room
 */
export function run(room: Room): void {
    clearMemory();
    _loadCreeps(room);
    _buildMissingCreeps(room);

    _.each(creeps, (creep: Creep) => {
        if (creep.memory.role === "harvester") {
            harvester.run(creep);
        }
        if (creep.memory.role === "builder") {
            builder.run(creep);
        }
        if (creep.memory.role === "upgrader") {
            upgrader.run(creep);
        }
    });
}

export function clearMemory() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    }
}

/**
 * Loads and counts all available creeps.
 *
 * @param {Room} room
 */
function _loadCreeps(room: Room) {
    creeps = room.find<Creep>(FIND_MY_CREEPS);
    creepCount = _.size(creeps);

    // Iterate through each creep and push them into the role array.
    harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
    upgraders = _.filter(creeps, (creep) => creep.memory.role === "upgrader");
    builders = _.filter(creeps, (creep) => creep.memory.role === "builder");

    if (Config.ENABLE_DEBUG_MODE) {
        log.info(creepCount + " creeps found in the playground.");
    }
}

/**
 * Creates a new creep if we still have enough space.
 *
 * @param {Room} room
 */
function _buildMissingCreeps(room: Room) {
    let bodyParts: string[];

    const spawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
        filter: (spawn: Spawn) => {
            return spawn.spawning === null;
        },
    });

    if (Config.ENABLE_DEBUG_MODE) {
        if (spawns[0]) {
            log.info("Spawn: " + spawns[0].name);
        }
    }

    if (room.energyCapacityAvailable <= 800) {
        bodyParts = [WORK, WORK, CARRY, MOVE];
    } else if (room.energyCapacityAvailable > 800) {
        bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    }

    if (harvesters.length < 3) {
        _.each(spawns, (spawn: Spawn) => {
            _spawnCreep(spawn, bodyParts, "harvester");
        });
    } else if (upgraders.length < 3) {
        _.each(spawns, (spawn: Spawn) => {
            _spawnCreep(spawn, bodyParts, "upgrader");
        });
    } else if (builders.length < 5) {
        _.each(spawns, (spawn: Spawn) => {
            _spawnCreep(spawn, bodyParts, "builder");
        });
    }
}

/**
 * Spawns a new creep.
 *
 * @param {Spawn} spawn
 * @param {string[]} bodyParts
 * @param {string} role
 * @returns
 */
function _spawnCreep(spawn: Spawn, bodyParts: string[], role: string) {
    const uuid: number = Memory.uuid;
    let status: number | string = spawn.canCreateCreep(bodyParts, undefined);

    const properties: { [key: string]: any } = {
        role,
        room: spawn.room.name,
    };

    status = _.isString(status) ? OK : status;
    if (status === OK) {
        Memory.uuid = uuid + 1;
        const creepName: string = spawn.room.name + " - " + role + uuid;

        log.info("Started creating new creep: " + creepName);
        if (Config.ENABLE_DEBUG_MODE) {
            log.info("Body: " + bodyParts);
        }

        status = spawn.createCreep(bodyParts, creepName, properties);

        return _.isString(status) ? OK : status;
    } else {
        if (Config.ENABLE_DEBUG_MODE) {
            log.info("Failed creating new creep: " + status);
        }

        return status;
    }
}
