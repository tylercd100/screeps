/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:48:41
*/

'use strict';

import {Task, WithdrawFromContainer, HarvestTask, RenewTask, FillWithEnergyTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class EnergizerCreep extends BaseCreep {
    run() {

        this.decrementSleep();

        if (!this.isAsleep()) {
            let creep = this.creep;
            let room = creep.room;
            let spawn = this.getClosestSpawn();
            let container = this.getClosestContainerWithResource(RESOURCE_ENERGY);

            this.setRenewToggle();
            this.setWorkingToggle();

            let task: Task = Task.fromMemory(creep)
            
            if(!task) {
                if(!creep.memory.working) {
                    if (container) {
                        task = new WithdrawFromContainer(container, RESOURCE_ENERGY);
                    } else {
                        task = new HarvestTask(this.getClosestSource());
                    }
                } else {
                    let fillable = this.getClosestFillable()
                    if(fillable) {
                        task = new FillWithEnergyTask(fillable);
                    } else {
                        this.setSleep(25);
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

    static type: string = "energizer";

    static createCreep(room: Room, level: number): string|number|null {
        const spawn = EnergizerCreep.getSpawn(room);
        const body = EnergizerCreep.getBody(room, level);
        const name = EnergizerCreep.getName();
        const memory = EnergizerCreep.getMemory();
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(), {
            type: EnergizerCreep.type,
        });
    }

    static getName(): string {
        return EnergizerCreep.type+"-"+BaseCreep.getName();
    }

    /**
     * MOVE          50
     * WORK          100
     * CARRY         50
     * ATTACK        80
     * RANGED_ATTACK 150
     * HEAL          250
     * CLAIM         600
     * TOUGH         10
     * @param  {Room}     room [description]
     * @return {string[]}      [description]
     */
    static getBody(room: Room, level: number): string[] {
        switch (level) {
            case 1: // 300
                return [WORK, CARRY, CARRY, CARRY, MOVE];
            case 2: // 550
                return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE];
            case 3: // 800
            case 4:
            default:
                return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
    }
}
