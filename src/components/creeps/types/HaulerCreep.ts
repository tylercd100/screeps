/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:47:41
*/

'use strict';

import {Task, WithdrawFromContainer, DepositIntoContainer, RenewTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class HaulerCreep extends BaseCreep {
    run() {

        this.decrementSleep();

        if (!this.isAsleep()) {
            let creep = this.creep;
            let room = creep.room;
            let controller = room.controller;

            this.setRenewToggle();
            this.setWorkingToggle();

            let task: Task = Task.fromMemory(creep)
            
            if(!task) {
                let spawn = this.getClosestSpawn();
                let containerSpawn: StructureContainer = spawn.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER});
                let containerController: StructureContainer = controller.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER});
                let containerResources: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER && s.id !== containerSpawn.id && s.id !== containerController.id});
                if(!creep.memory.working) {
                    task = new WithdrawFromContainer(_.max(containerResources, (c) => c.store[RESOURCE_ENERGY]));
                } else {
                    if(containerSpawn.store[RESOURCE_ENERGY] - 150 <= containerController.store[RESOURCE_ENERGY]) {
                        task = new DepositIntoContainer(containerSpawn);
                    } else {
                        task = new DepositIntoContainer(containerController);
                    }
                }

                if(task) {
                    console.log(creep.name,"is starting task",task.taskType);
                }
            }

            if(task) {
                let result = task.run(creep);
                if (result === Task.IN_PROGRESS) {
                    creep.memory.task = task.toMemory();
                } else {
                    creep.memory.task = null;
                }
            }
        }
    }

    static type: string = "hauler";

    static createCreep(room: Room, level: number = 1): string|number|null {
        const spawn = HaulerCreep.getSpawn(room);
        const body = HaulerCreep.getBody(room, level);
        const name = HaulerCreep.getName();
        const memory = HaulerCreep.getMemory();
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(), {
            type: HaulerCreep.type,
        });
    }

    static getName(): string {
        return HaulerCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(room: Room, level: number = 1): string[] {
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
