/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:47:41
*/

'use strict';

import {Task, WithdrawFromContainerTask, DepositIntoContainerTask, RenewTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class HaulerCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        let room = creep.room;
        let controller = room.controller;
        
        if(!task) {
            let spawn = this.getClosestSpawn();
            let containerSpawn: StructureContainer = spawn.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER});
            let containerController: StructureContainer = controller.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER});
            let containerResources: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER && s.id !== containerSpawn.id && s.id !== containerController.id});
            if(!creep.memory.working) {
                task = new WithdrawFromContainerTask(_.max(containerResources, (c) => c.store[RESOURCE_ENERGY]));
            } else {
                if(containerSpawn.store[RESOURCE_ENERGY] - 150 <= containerController.store[RESOURCE_ENERGY]) {
                    task = new DepositIntoContainerTask(containerSpawn);
                } else {
                    task = new DepositIntoContainerTask(containerController);
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'purple'});
    }

    static type: string = "hauler";

    static createCreep(room: Room, level: number = 1): string|number|null {
        const spawn = HaulerCreep.getSpawn(room);
        const body = HaulerCreep.getBody(room, level);
        const name = HaulerCreep.getName();
        const memory = HaulerCreep.getMemory(room);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(room: Room): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(room), {
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
