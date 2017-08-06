/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-01 19:22:35
*/

'use strict';

import {Task, BuildTask, HarvestTask, GotoRoomTask, DepositIntoStockpileTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import {Nest} from "./../../nest/Nest";

export class HarvesterCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        let room = creep.room;
        
        if(!task) {
            
            if(!creep.memory.working) {
                let target = creep.memory.station;

                if(target) {
                    if (creep.room.name === target) {
                        let resource = this.getClosestDroppedResource();
                        if (resource) {
                            task = new HarvestTask(resource);
                        } else {
                            task = new HarvestTask(this.getClosestSource());
                        }
                    } else {
                        task = new GotoRoomTask(target);
                    }
                }
            } else {

                let target = creep.memory.nest;

                if(target) {
                    if (creep.room.name === target) {
                        task = new DepositIntoStockpileTask(this.getClosestAvailableStockpile());
                    } else {
                        task = new GotoRoomTask(target);
                    }
                }
            }
        }
        
        if (creep.memory.working) {
            if (room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos).length > 0) {
                let site = creep.pos.findClosestByRange<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES)
                task = new BuildTask(site);
            }
        } else {
            if (room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos).length === 0 && room.lookForAt(LOOK_STRUCTURES, creep.pos).length === 0 && _.includes(room.lookForAt(LOOK_TERRAIN, creep.pos), "swamp")) {
                room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'orange'});
    }

    static type: string = "harvester";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = HarvesterCreep.getBody(level);
        const name = HarvesterCreep.getName();
        const memory = HarvesterCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: HarvesterCreep.type,
        });
    }

    static getName(): string {
        return HarvesterCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(level: number = 1): string[] {
        switch (level) {
            case 1: // 300
            case 2: // 550
                return [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
            case 3: // 800
            case 4:
                return [WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
            default:
                return [WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
        }
    }
}
