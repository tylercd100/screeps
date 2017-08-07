/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
<<<<<<< HEAD
* @Last Modified time: 2017-08-06 20:16:03
=======
* @Last Modified time: 2017-08-05 23:33:45
>>>>>>> d75c12d00daca4c3859b529846d088071176631a
*/

'use strict';

import {Task, WithdrawFromStockpileTask, DepositIntoStockpileTask, FillWithEnergyTask, HarvestTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import {Nest} from "./../../nest/Nest";

export class HaulerCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        let room = creep.room;
        let controller = room.controller;
        
        if(!task) {
            let spawn = this.getClosestSpawn();
            let storageSpawn: StructureContainer|StructureStorage = null;
            let containerSpawn: StructureContainer|StructureStorage|null = null;
            let containerController: StructureContainer|null = null;
            let linkSpawn = spawn.pos.findClosestByRange<StructureLink>(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK});
            if(spawn) {
                containerSpawn = this.getSpawnContainer(spawn)
                storageSpawn = this.getSpawnStorage(spawn)
            }
            if(controller) {
                containerController = controller.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER});
            }
            let containerResources: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER && s.id !== _.get(containerSpawn, "id") && s.id !== _.get(containerController, "id")});
            
            if(!creep.memory.working) {
                let resource = this.getClosestDroppedResource();
                if (resource) {
                    task = new HarvestTask(resource);
                } else {
                    if(linkSpawn && linkSpawn.energy > 0) {
                        task = new WithdrawFromStockpileTask(linkSpawn);
                    } else {
                        task = new WithdrawFromStockpileTask(_.max(containerResources, (c) => c.store[RESOURCE_ENERGY]));
                    }
                }
            } else {
                let energyController = containerController.store[RESOURCE_ENERGY];
                let energySpawn = _.sum([
                    containerSpawn ? containerSpawn.store[RESOURCE_ENERGY] : 0,
                    storageSpawn ? storageSpawn.store[RESOURCE_ENERGY] : 0,
                ]);

                if(energySpawn < room.energyCapacityAvailable) {
                    if(containerSpawn && _.sum(containerSpawn.store) < containerSpawn.storeCapacity) {
                        task = new DepositIntoStockpileTask(containerSpawn);
                    } else if (storageSpawn && _.sum(storageSpawn.store) < storageSpawn.storeCapacity) {
                        task = new DepositIntoStockpileTask(storageSpawn);
                    } 
                } else if (energyController < containerController.storeCapacity) {
                    if(containerController) {
                        task = new DepositIntoStockpileTask(containerController);
                    }
                } else {
                    if(storageSpawn) {
                        task = new DepositIntoStockpileTask(storageSpawn);
                    }
                }

                if(!task) {
                    if (_.sum(creep.carry) < creep.carryCapacity) {
                        creep.memory.working = false;
                    } else {
                        this.setSleep(25);
                    }
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'purple'});
    }

    static type: string = "hauler";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = HaulerCreep.getBody(level);
        const name = HaulerCreep.getName();
        const memory = HaulerCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: HaulerCreep.type,
        });
    }

    static getName(): string {
        return HaulerCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(level: number = 1): string[] {
        switch (level) {
            case 1: // 300
                return [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            case 2: // 550
                return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 3: // 800
            case 4:
            default:
                return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    }
}
