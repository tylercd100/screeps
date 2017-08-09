/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:51:45
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-06 11:40:47
*/

'use strict';

import * as Config from "./../../../config/config";
import {Task, GotoTargetTask} from "./../tasks/Tasks";
import {Nest} from "./../../nest/Nest";

export abstract class BaseCreep {
    constructor(protected creep: Creep) {}

    public run() {
        this.decrementSleep();

        if (!this.isAsleep()) {
            this.setRenewToggle();
            this.setWorkingToggle();

            let oldTask: Task|undefined = Task.fromMemory(this.creep)

            let newTask: Task = this.handle(oldTask);


            if(newTask) {
                if(_.get(newTask, "taskType") !== _.get(oldTask, "taskType")) {
                    // console.log(this.creep.name,"is starting task",newTask.taskType);
                }
                
                let result = newTask.run(this.creep);
                if (result === Task.IN_PROGRESS) {
                    this.creep.memory.task = newTask.toMemory();
                } else {
                    this.creep.memory.task = null;
                }
            }
        }

        this.draw();
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

    gotoRally(): Task {
        let task: Task;
        let creep = this.creep;
        let target = this.getFlag("Rally");
        if(!target) {
            target = new RoomPosition(24, 24, creep.memory.station);
        }
        if(!target) {
            target = this.getClosestSpawn();
        }

        if(target) {
            if(target.pos.getRangeTo(creep.pos) > 2) {
                task = new GotoTargetTask(target)
            }
        } else {
            creep.move(creep.pos.getDirectionTo(24, 24));
        }

        return task;
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

    getFlag(name: string): Flag {
        return this.creep.pos.findClosestByRange<Flag>(FIND_FLAGS, {
            filter: (f: Flag) => f.name === name
        });
    }

    getClosestSource(): Source {
        return this.creep.pos.findClosestByPath<Source>(FIND_SOURCES, {filter: (source: Source) => {
            return source.energy > 10;
        }});
    }

    getClosestSpawn(): Spawn {
        return this.creep.pos.findClosestByRange<Spawn>(FIND_MY_SPAWNS);
    }

    getClosestTower(): Tower {
        return this.creep.pos.findClosestByPath<Tower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    }

    getClosestConstructionSite(): ConstructionSite|undefined {
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

    getClosestDamagedStructure(): Structure {
        return this.creep.pos.findClosestByPath<Structure>(FIND_MY_CONSTRUCTION_SITES, {
            filter: (structure: StructureSpawn) => structure.hits < structure.hitsMax,
        });
    }

    getClosestFillable(): StructureExtension|StructureSpawn|undefined {
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

    getClosestStockpile(): StructureContainer|StructureStorage {
        return this.creep.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
            filter: (structure:Structure) => structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE,
        })
    }

    getClosestStockpileWithResource(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage {
        return this.creep.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
            filter: (structure:StructureContainer|StructureStorage) => ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && structure.store && structure.store[resource] > 0),
        })
    }

    getClosestAvailableStockpile(): StructureContainer|StructureStorage {
        return this.creep.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
            filter: (structure:StructureContainer|StructureStorage) => ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity),
        })
    }

    getClosestAvailableLink(): StructureLink {
        return this.creep.pos.findClosestByRange<StructureLink>(FIND_STRUCTURES, {
            filter: (structure:StructureLink) => (structure.structureType === STRUCTURE_LINK && structure.energy < structure.energyCapacity),
        })
    }

    getClosestDroppedResource() {
        return _.first(this.creep.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 10));
    }

    getSmallestStockpile(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage {
        return _.min(this.getStockpiles(), (c: StructureContainer|StructureStorage) => c.store[resource]);
    }

    getLargestStockpile(resource = RESOURCE_ENERGY): StructureContainer|StructureStorage|undefined {
        let x = _.max(this.getStockpiles(), (c: StructureContainer|StructureStorage) => c.store[resource]);
        return x.store[resource] > 0 ? x : undefined;
    }

    getSpawnStockpile(spawn: Spawn): StructureContainer|StructureStorage {
        return spawn.pos.findClosestByRange<StructureContainer|StructureStorage>(FIND_STRUCTURES, {filter: (s: StructureContainer|StructureStorage) => s.structureType===STRUCTURE_CONTAINER || s.structureType===STRUCTURE_STORAGE});
    }

    getStockpiles(): (StructureContainer|StructureStorage)[] {
        return this.creep.room.find<StructureContainer|StructureStorage>(FIND_STRUCTURES, {
            filter: (structure:Structure) => {return structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE},
        })
    }

    getBodyTotalCost() {
        return BaseCreep.calcTotalBodyCost(this.creep.body);
    }



    /*================================
    =            ABSTRACT            =
    ================================*/

    protected abstract handle(task: Task|undefined): Task;
    protected abstract draw(): void;


    /*==============================
    =            STATIC            =
    ==============================*/

    static calcTotalBodyCost(body: {type: string}[]) {
        return _.reduce(body, (sum, part) => {
            switch (part.type) {
                case MOVE:
                    return sum + 50;
                case WORK:
                    return sum + 100;
                case CARRY:
                    return sum + 50;
                case ATTACK:
                    return sum + 80;
                case RANGED_ATTACK:
                    return sum + 150;
                case HEAL:
                    return sum + 250;
                case CLAIM:
                    return sum + 600;
                case TOUGH:
                    return sum + 10;
            }
            return sum;
        }, 0);
    }

    // static getSpawn(room: Room) {
    //     const spawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
    //         filter: (spawn: Spawn) => !spawn.spawning
    //     });

    //     if (spawns[0]) {
    //         return spawns[0];
    //     }

    //     return null;
    // }

    static getMemory(nest: Nest): {[key: string]: any} {
        return {nest: nest.name};
    }

    static getName(): string {
        return (Math.ceil(Math.random()*10000))+"";
    }
}
