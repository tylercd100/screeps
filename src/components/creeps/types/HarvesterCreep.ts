/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:47:41
*/

'use strict';

import {Task, BuildTask, HarvestTask, GotoRoomTask, DepositIntoContainerTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import * as Plans from "./../../rooms/Plans";

export class HarvesterCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        let room = creep.room;
        
        if(!task) {
            
            if(!creep.memory.working) {
                let roomName;
                
                if(!roomName) {
                    roomName = this.getRoom(Plans.HARVEST_SOURCES);
                }

                if(roomName) {
                    if (creep.room.name === roomName) {
                        task = new HarvestTask(this.getClosestSource());
                    } else {
                        task = new GotoRoomTask(roomName);
                    }
                }
                // task = new WithdrawFromContainerTask(_.max(containerResources, (c) => c.store[RESOURCE_ENERGY]));
            } else {

                this.getClosestConstructionSite

                let roomName;
                
                if(!roomName) {
                    roomName = this.getRoom(Plans.BASE);
                }

                if(roomName) {
                    if (creep.room.name === roomName) {
                        task = new DepositIntoContainerTask(this.getClosestContainer());
                    } else {
                        task = new GotoRoomTask(roomName);
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

    static createCreep(room: Room, level: number = 1): string|number|null {
        const spawn = HarvesterCreep.getSpawn(room);
        const body = HarvesterCreep.getBody(room, level);
        const name = HarvesterCreep.getName();
        const memory = HarvesterCreep.getMemory(room);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(room: Room): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(room), {
            type: HarvesterCreep.type,
        });
    }

    static getName(): string {
        return HarvesterCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(room: Room, level: number = 1): string[] {
        switch (level) {
            case 1: // 300
            case 2: // 550
                return [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
            case 3: // 800
            case 4:
            default:
                return [WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    }
}
