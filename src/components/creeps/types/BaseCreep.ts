/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:51:45
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 09:18:34
*/

'use strict';

import * as Config from "./../../../config/config";

export abstract class BaseCreep {
    constructor(protected room: Room, protected creep: Creep) {
    }

    decrementSleep() {
        if(this.isAsleep()) {
            this.creep.memory.sleep--;
        }
    }

    setSleep(time: number): void {
        this.creep.say("Zzz");
        this.creep.memory.sleep = time;
    }

    isAsleep(): boolean {
        return this.creep.memory.sleep > 0;
    }

    setWorkingToggle(): void {
        if(_.sum(this.creep.carry) === this.creep.carryCapacity) {
            this.creep.memory.working = true;
        }
        if(_.sum(this.creep.carry) === 0) {
            this.creep.memory.working = false;
        }
    }

    setRenewToggle(): void {
        if(this.creep.ticksToLive < Config.DEFAULT_MIN_LIFE_BEFORE_NEEDS_REFILL) {
            this.creep.memory.renew = true
        }
        if(this.creep.ticksToLive >= Config.DEFAULT_MIN_LIFE_TO_BE_FULL) {
            this.creep.memory.renew = false
        }
    }

    getClosestSource(): Source {
        return this.creep.pos.findClosestByPath<Source>(FIND_SOURCES_ACTIVE);
    }

    getClosestSpawn(): Spawn {
        return this.creep.pos.findClosestByPath<Spawn>(FIND_MY_SPAWNS);
    }

    getClosestConstructionSite(): ConstructionSite {
        return this.creep.pos.findClosestByPath<ConstructionSite>(FIND_CONSTRUCTION_SITES);
    }

    getClosestDamagedStructure(): Structure {
        return this.creep.pos.findClosestByPath<Structure>(FIND_MY_CONSTRUCTION_SITES, {
            filter: (structure: StructureSpawn) => structure.hits < structure.hitsMax;
        });
    }

    getClosestFillable(): StructureExtension|StructureSpawn|StructureTower {
        let x = this.creep.room.find<StructureExtension|StructureSpawn|StructureTower>(FIND_STRUCTURES, {
            filter: (structure: StructureExtension|StructureSpawn|StructureTower) => {
                const match = (
                    structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_TOWER) && (structure.energy < structure.energyCapacity);
                return match;
            }
        });
        return x.length > 0 ? x[0] : null;
    }

    getClosestContainer(): StructureContainer {
        return this.creep.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {
            filter: (structure:Structure) => structure.structureType === STRUCTURE_CONTAINER,
        })
    }

    getClosestContainerWithResource(resource = RESOURCE_ENERGY): StructureContainer {
        return this.creep.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {
            filter: (structure:StructureContainer) => (structure.structureType === STRUCTURE_CONTAINER && structure.store && structure.store[resource] > 0),
        })
    }

    getSmallestContainer(resource = RESOURCE_ENERGY): StructureContainer {
        return _.min(this.getContainers(), (c: StructureContainer) => c.store[resource]);
    }

    getLargestContainer(resource = RESOURCE_ENERGY): StructureContainer {
        let x = _.max(this.getContainers(), (c: StructureContainer) => c.store[resource]);
        return x.store[resource] > 0 ? x : null;
    }

    getContainers(): StructureContainer[] {
        return this.creep.room.find<StructureContainer>(FIND_STRUCTURES, {
            filter: (structure:Structure) => structure.structureType === STRUCTURE_CONTAINER,
        })
    }

    /*================================
    =            ABSTRACT            =
    ================================*/

    abstract run(): void;

    /*==============================
    =            STATIC            =
    ==============================*/

    static getSpawn(room: Room) {
        const spawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
            filter: (spawn: Spawn) => !spawn.spawning
        });

        if (spawns[0]) {
            return spawns[0];
        }

        return null;
    }

    static getMemory(): {[key: string]: any} {
        return {};
    }

    static getName(): string {
        return (Math.ceil(Math.random()*10000));
    }
}
