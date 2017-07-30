/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:43:24
*/

'use strict';

import {Task, DepositIntoContainerTask, BuildTask, HarvestTask, RenewTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class MinerCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        let room = creep.room;
        
        if(!task) {
            if(!creep.memory.working) {
                task = new HarvestTask(this.getClosestSource());
            } else {
                var site = this.getClosestConstructionSite();
                var container = this.getClosestContainer();
                if(container) {
                    task = new DepositIntoContainerTask(container, RESOURCE_ENERGY);
                } else if (site) {
                    task = new BuildTask(site);
                }
            }

            if(task) {
                console.log(creep.name,"is starting task",task.taskType);
            }
        }

        return task;  
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'blue'});
    }

    static type: string = "miner";

    static createCreep(room: Room, level: number = 1): string|number|null {
        const spawn = MinerCreep.getSpawn(room);
        const body = MinerCreep.getBody(room, level);
        const name = MinerCreep.getName();
        const memory = MinerCreep.getMemory();
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(), {
            type: MinerCreep.type,
        });
    }

    static getName(): string {
        return MinerCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(room: Room, level: number = 1): string[] {
        switch (level) {
            case 1: // 300
                return [WORK, WORK, CARRY, MOVE];
            case 2: // 550
                return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
            case 3: // 800
            case 4:
            default:
                return [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
    }
}
