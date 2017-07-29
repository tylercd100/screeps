/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:43:24
*/

'use strict';

import {Task, DepositIntoContainer, BuildTask, HarvestTask, RenewTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class MinerCreep extends BaseCreep {
    run() {

        this.decrementSleep();

        if (!this.isAsleep()) {
            let creep = this.creep;
            let room = creep.room;

            this.setRenewToggle();
            this.setWorkingToggle();

            let task: Task = Task.fromMemory(creep)
            
            if(!task) {
                if(!creep.memory.working) {
                    task = new HarvestTask(this.getClosestSource());
                } else {
                    var site = this.getClosestConstructionSite();
                    var container = this.getClosestContainer();
                    if(container) {
                        task = new DepositIntoContainer(container, RESOURCE_ENERGY);
                    } else if (site) {
                        task = new BuildTask(site);
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
