/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:51:45
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 09:18:34
*/

'use strict';

import * as Config from "./../../../config/config";
import {Task} from "./../tasks/Tasks";
import * as Plans from "./../../rooms/Plans";

export abstract class BaseCreep {
    constructor(protected room: Room, protected creep: Creep) {}

    public run() {
        this.decrementSleep();

        if (!this.isAsleep()) {
            this.setRenewToggle();
            this.setWorkingToggle();

            let oldTask: Task = Task.fromMemory(this.creep)

            let newTask: Task = this.handle(oldTask);


            if(newTask) {
                if(_.get(newTask, "taskType") !== _.get(oldTask, "taskType")) {
                    console.log(this.creep.name,"is starting task",newTask.taskType);
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

    getClosestTower(): Tower {
        return this.creep.pos.findClosestByPath<Tower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    }

    getClosestConstructionSite(): ConstructionSite {
        let priority = [
            {structureType: STRUCTURE_CONTAINER},
            {structureType: STRUCTURE_ROAD},
            {structureType: STRUCTURE_EXTENSION},
        ];

        let target = null;
        _.forEach(priority, (options) => {
            if (!target) {
                target = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: (x: ConstructionSite) => {
                        return x.structureType === options.structureType;
                    }
                });
            }
        });

        if (!target) { 
            target = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        }

        return target;
    }

    getClosestDamagedStructure(): Structure {
        return this.creep.pos.findClosestByPath<Structure>(FIND_MY_CONSTRUCTION_SITES, {
            filter: (structure: StructureSpawn) => structure.hits < structure.hitsMax;
        });
    }

    getClosestFillable(): StructureExtension|StructureSpawn|StructureTower {
        let priority = [
            {structureType: STRUCTURE_SPAWN},
            {structureType: STRUCTURE_EXTENSION},
            {structureType: STRUCTURE_TOWER},
        ];

        let target = null;
        _.forEach(priority, (options) => {
            if (!target) {
                target = this.creep.pos.findClosestByRange<StructureExtension|StructureSpawn|StructureTower>(FIND_STRUCTURES, {
                    filter: (x: StructureExtension|StructureSpawn|StructureTower) => {
                        return x.structureType === options.structureType && x.energy < x.energyCapacity;
                    }
                });
            }
        });

        return target;
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

    protected getRoom(targetPlan: number): string {
        for (const name in Plans.rooms) {
            let x = Plans.rooms[name];
            if (x === targetPlan) {
                return name;
            }
        }
        return null;
    }

    /*================================
    =            ABSTRACT            =
    ================================*/

    protected abstract handle(task: Task): Task;
    protected abstract draw(): void;


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

    static getMemory(room: Room): {[key: string]: any} {
        return {room: room.name};
    }

    static getName(): string {
        return (Math.ceil(Math.random()*10000))+"";
    }
}
