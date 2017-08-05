/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-04 12:14:46
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
            let containerSpawn: StructureContainer|StructureStorage|null = null;
            let containerController: StructureContainer|null = null
            if(spawn) {
                containerSpawn = this.getSpawnStockpile(spawn)
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
                    task = new WithdrawFromStockpileTask(_.max(containerResources, (c) => c.store[RESOURCE_ENERGY]));
                }
            } else {
                if(containerSpawn && _.sum(containerSpawn.store) < containerSpawn.storeCapacity && containerSpawn.store[RESOURCE_ENERGY] - room.energyCapacityAvailable < containerController.store[RESOURCE_ENERGY]) {
                    task = new DepositIntoStockpileTask(containerSpawn);
                } else if (containerController && _.sum(containerController.store) < containerController.storeCapacity) {
                    task = new DepositIntoStockpileTask(containerController);
                } else {
                    let fillable = this.getClosestFillable();
                    task = new FillWithEnergyTask(fillable);
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
